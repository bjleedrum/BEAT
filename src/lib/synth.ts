/**
 * 패턴 소리를 WAV로 미리 렌더링한다 (프로토타입의 drum()/click() 소리를 그대로 계산).
 * 한 파일로 재생하므로 음과 음 사이 간격이 정확하다. 시간 단위는 초, 파일 시작 = 0.
 */
import { File, Paths } from 'expo-file-system';

import { BARS, PlayLesson } from './lessons';
import { buildNotes, RunInfo } from './scoring';

const SR = 22050;
/** 파일 앞 여백 (프로토타입의 start = now + 0.2 와 같음) */
const LEAD = 0.2;

let noise: Float32Array | null = null;
function noiseBuf() {
  if (!noise) {
    noise = new Float32Array(Math.round(SR * 0.3));
    for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** 지수 감쇠: t=0에 v, t=dur에 0.001 */
const decay = (v: number, t: number, dur: number) => v * Math.pow(0.001 / v, t / dur);

function addDrum(out: Float32Array, t: number, accent: boolean) {
  const v = accent ? 0.9 : 0.38, s0 = Math.round(t * SR), nb = noiseBuf();
  // 노이즈 → 1200Hz 하이패스 (Q=1)
  const w = (2 * Math.PI * 1200) / SR, alpha = Math.sin(w) / 2, cw = Math.cos(w), a0 = 1 + alpha;
  const b0 = (1 + cw) / 2 / a0, b1 = -(1 + cw) / a0, b2 = b0, a1 = (-2 * cw) / a0, a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const nN = Math.round(SR * 0.2);
  for (let i = 0; i < nN && s0 + i < out.length; i++) {
    const x = nb[i % nb.length], y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    const tt = i / SR;
    if (s0 + i >= 0) out[s0 + i] += y * (tt < 0.16 ? decay(v, tt, 0.16) : 0);
  }
  // 삼각파 220 → 140Hz
  let ph = 0;
  const nO = Math.round(SR * 0.1);
  for (let i = 0; i < nO && s0 + i < out.length; i++) {
    const tt = i / SR, f = tt < 0.08 ? 220 * Math.pow(140 / 220, tt / 0.08) : 140;
    ph += f / SR;
    const tri = 4 * Math.abs(ph - Math.floor(ph + 0.5)) - 1;
    if (s0 + i >= 0) out[s0 + i] += tri * (tt < 0.09 ? decay(v * 0.8, tt, 0.09) : 0);
  }
}

function addClick(out: Float32Array, t: number, strong: boolean, vol: number) {
  const f = strong ? 1760 : 1175, s0 = Math.round(t * SR), n = Math.round(SR * 0.05);
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const tt = i / SR, sq = ((tt * f) % 1) < 0.5 ? 1 : -1;
    out[s0 + i] += sq * (tt < 0.035 ? decay(vol, tt, 0.035) : 0);
  }
}

function toWav(buf: Float32Array): Uint8Array {
  const n = buf.length, bytes = new Uint8Array(44 + n * 2), d = new DataView(bytes.buffer);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  str(0, 'RIFF'); d.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
  d.setUint32(24, SR, true); d.setUint32(28, SR * 2, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true);
  str(36, 'data'); d.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) d.setInt16(44 + i * 2, Math.max(-1, Math.min(1, buf[i] * 0.65)) * 0x7fff, true);
  return bytes;
}

function writeFile(name: string, bytes: Uint8Array) {
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.writeSync(bytes);
  return f.uri;
}

export type Rendered = RunInfo & { uri: string; start: number; beat: number; n: number };

/**
 * @param countIn 4박 카운트(클릭) 후 시작
 * @param notes   드럼 소리 넣기 (듣기)
 * @param clicks  메트로놈 클릭 넣기
 */
export function renderPattern(lesson: PlayLesson, bpm: number, opt: { countIn: boolean; notes: boolean; clicks: boolean }): Rendered {
  const beat = 60 / bpm, n = lesson.tokens.length;
  const start = LEAD, t0 = opt.countIn ? start + 4 * beat : start;
  const run = buildNotes(lesson, bpm, t0, BARS);
  const buf = new Float32Array(Math.ceil((run.end + 0.4) * SR));
  if (opt.countIn) for (let k = 0; k < 4; k++) addClick(buf, start + k * beat, k === 0, 0.5);
  if (opt.notes) run.notes.forEach(nt => addDrum(buf, nt.t, nt.accent));
  if (opt.clicks) for (let k = 0; k < BARS * 4; k++) addClick(buf, t0 + k * beat, k % 4 === 0, 0.35);
  const uri = writeFile(`pattern-${opt.notes ? 'n' : ''}${opt.clicks ? 'c' : ''}${opt.countIn ? 'i' : ''}.wav`, toWav(buf));
  return { ...run, uri, start, beat, n };
}

/** 탭할 때 나는 짧은 드럼 소리 */
let tapUri: string | null = null;
export function tapSoundUri() {
  if (!tapUri) {
    const buf = new Float32Array(Math.round(SR * 0.22));
    addDrum(buf, 0, false);
    tapUri = writeFile('tap.wav', toWav(buf));
  }
  return tapUri;
}
