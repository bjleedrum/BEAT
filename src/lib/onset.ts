/**
 * 타격(onset) 감지기. 프로토타입 AudioWorklet 코드를 그대로 옮긴 순수 로직.
 * 빠른 포락선(1ms 상승, 12ms 하강)이 임계값을 넘고 느린 포락선(120ms)의 2.2배를 넘으면 타격.
 * 감지 후 20ms 동안 최대값을 세기(peak)로 기록, 60ms 안의 재감지는 무시.
 * 시간은 스트림 첫 샘플 = 0 기준의 초.
 */
export type Onset = { t: number; peak: number };

/** 감도 1~10 → 임계값 (프로토타입과 같음) */
export const thresholdFor = (sens: number) => 0.2 * Math.pow(0.6, sens - 1);

export class OnsetDetector {
  private f = 0; private s = 0; private last = -1; private left = 0; private pk = 0; private t = 0;
  private lv = 0; private ln = 0;
  private aF: number; private rF: number; private aS: number;
  /** 지금까지 처리한 샘플 수 */
  samples = 0;
  thr = thresholdFor(5);

  constructor(readonly sr: number, private onHit: (o: Onset) => void, private onLevel?: (v: number) => void) {
    this.aF = 1 - Math.exp(-1 / (sr * 0.001));
    this.rF = 1 - Math.exp(-1 / (sr * 0.012));
    this.aS = 1 - Math.exp(-1 / (sr * 0.12));
  }

  process(c: Float32Array) {
    const sr = this.sr;
    for (let i = 0; i < c.length; i++) {
      const x = Math.abs(c[i]);
      this.f += (x > this.f ? this.aF : this.rF) * (x - this.f);
      this.s += this.aS * (x - this.s);
      const t = (this.samples + i) / sr;
      if (this.left > 0) {
        if (x > this.pk) this.pk = x;
        if (--this.left === 0) this.onHit({ t: this.t, peak: this.pk });
      } else if (this.f > this.thr && this.f > this.s * 2.2 && t - this.last > 0.06) {
        this.last = t; this.t = t; this.pk = x; this.left = Math.round(sr * 0.02);
      }
      if (x > this.lv) this.lv = x;
      if (++this.ln > sr * 0.04) { this.onLevel?.(this.lv); this.lv = 0; this.ln = 0; }
    }
    this.samples += c.length;
  }
}

/**
 * 스트림 시간(샘플 수 기준) → performance.now() 초 변환.
 * 버퍼는 녹음된 뒤에 도착하므로 (도착 시각 − 버퍼 끝 샘플 시간)의 최솟값이 가장 정확한 기준점.
 */
export class StreamClock {
  private anchor = Infinity;
  /** 버퍼 하나를 받은 직후 호출 */
  observe(arrivalPerfSec: number, endStreamSec: number) {
    const a = arrivalPerfSec - endStreamSec;
    if (a < this.anchor) this.anchor = a;
  }
  get ready() { return Number.isFinite(this.anchor); }
  toPerf(streamSec: number) { return streamSec + this.anchor; }
}
