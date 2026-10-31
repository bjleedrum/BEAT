/**
 * 마이크 입력 (expo-audio AudioStream). 앱 전체에서 하나만 쓴다.
 * 감지한 타격을 구독하는 방식: mic.onHit(cb) / mic.onLevel(cb)
 */
import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioStream } from 'expo-audio';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef } from 'react';

import { Onset, OnsetDetector, StreamClock, thresholdFor } from './onset';
import { useStore } from './store';

const SR = 48000;
type HitCb = (o: Onset) => void;
type LevelCb = (v: number) => void;

export type Mic = {
  /** 권한 요청 + 시작. 실패하면 false */
  start: () => Promise<boolean>;
  stop: () => void;
  isOn: () => boolean;
  onHit: (cb: HitCb) => () => void;
  onLevel: (cb: LevelCb) => () => void;
  /** 스트림 시간 → performance.now() 초 */
  toPerf: (t: number) => number;
  /** 감지가 잠깐 반짝일 때 쓰는 현재 임계값 */
  threshold: () => number;
};

const Ctx = createContext<Mic | null>(null);

export function MicProvider({ children }: { children: ReactNode }) {
  const { settings } = useStore();
  const hitCbs = useRef(new Set<HitCb>());
  const levelCbs = useRef(new Set<LevelCb>());
  const det = useRef<OnsetDetector | null>(null);
  const clock = useRef(new StreamClock());
  const on = useRef(false);

  const { stream } = useAudioStream({
    sampleRate: SR, channels: 1, encoding: 'float32',
    onBuffer: buf => {
      const arrival = performance.now() / 1000;
      if (!det.current || det.current.sr !== buf.sampleRate) {
        det.current = new OnsetDetector(buf.sampleRate,
          o => hitCbs.current.forEach(cb => cb(o)),
          v => levelCbs.current.forEach(cb => cb(v)));
        det.current.thr = thresholdFor(settings.sens);
        clock.current = new StreamClock();
      }
      const d = det.current;
      // 모노 float32. 채널이 둘 이상이면 첫 채널만
      const all = new Float32Array(buf.data);
      const mono = buf.channels > 1 ? all.filter((_, i) => i % buf.channels === 0) : all;
      d.process(mono);
      clock.current.observe(arrival, d.samples / d.sr);
    },
  });

  useEffect(() => { if (det.current) det.current.thr = thresholdFor(settings.sens); }, [settings.sens]);
  useEffect(() => () => { try { stream.stop(); } catch {} }, [stream]);

  const sens = settings.sens;
  const mic = useMemo<Mic>(() => ({
    start: async () => {
      if (on.current) return true;
      try {
        const p = await requestRecordingPermissionsAsync();
        if (!p.granted) return false;
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true, shouldRouteThroughEarpiece: false });
        det.current = null;
        await stream.start();
        on.current = true;
        return true;
      } catch {
        return false;
      }
    },
    stop: () => { if (!on.current) return; on.current = false; try { stream.stop(); } catch {} },
    isOn: () => on.current,
    onHit: cb => { hitCbs.current.add(cb); return () => { hitCbs.current.delete(cb); }; },
    onLevel: cb => { levelCbs.current.add(cb); return () => { levelCbs.current.delete(cb); }; },
    toPerf: t => clock.current.toPerf(t),
    threshold: () => thresholdFor(sens),
  }), [stream, sens]);
  return <Ctx.Provider value={mic}>{children}</Ctx.Provider>;
}

export function useMic() {
  const m = useContext(Ctx);
  if (!m) throw new Error('MicProvider 밖에서 useMic을 썼어요');
  return m;
}

/** 레벨 미터용 0~1 (−60dB ~ 0dB) */
export const levelToUnit = (v: number) => Math.max(0, Math.min(1, (20 * Math.log10(Math.max(v, 1e-5)) + 60) / 60));
