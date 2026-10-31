/**
 * 연주 레슨 (프로토타입 vLesson + startListen/startPlay).
 * 소리는 패턴 전체를 WAV 하나로 렌더링해서 재생하고, 재생 위치(currentTime)를 기준 시계로 쓴다.
 * 지금은 화면 탭 모드. 마이크 모드는 오디오 엔진 단계에서 추가.
 */
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Notation } from '@/components/notation';
import { ResultView } from '@/components/result-view';
import { Button, H1, IconButton, page, Switch, T, TopBar } from '@/components/ui';
import { F, useBeat } from '@/constants/beat-theme';
import { BARS, PlayLesson } from '@/lib/lessons';
import { DEFAULT_LATENCY, evaluate, Hit, Result } from '@/lib/scoring';
import { useStore } from '@/lib/store';
import { Rendered, renderPattern, tapSoundUri } from '@/lib/synth';

type Phase = 'intro' | 'listen' | 'play' | 'result';
const MODE = 'tap' as const;

let audioModeSet = false;
async function ensureAudioMode() {
  if (audioModeSet) return;
  audioModeSet = true;
  try { await setAudioModeAsync({ playsInSilentMode: true }); } catch {}
}

const median = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };

export function PlayScreen({ lesson: l }: { lesson: PlayLesson }) {
  const c = useBeat();
  const { progress, saveScore } = useStore();
  const [bpm, setBpm] = useState(progress[l.id]?.bpm ?? l.bpm);
  const [clickOn, setClickOn] = useState(true); // 탭 모드는 기본으로 켬 (프로토타입과 같음)
  const [phase, setPhase] = useState<Phase>('intro');
  const [listened, setListened] = useState(false);
  const [now, setNow] = useState(-1);
  const [barNo, setBarNo] = useState(1);
  const [count, setCount] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [padHit, setPadHit] = useState(false);
  const [err, setErr] = useState('');

  const player = useRef<AudioPlayer | null>(null);
  const tapPlayer = useRef<AudioPlayer | null>(null);
  const run = useRef<Rendered | null>(null);
  const hits = useRef<Hit[] | null>(null);
  const offs = useRef<number[]>([]); // currentTime - performance.now() 표본
  const raf = useRef(0);
  const flashT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRun = () => {
    cancelAnimationFrame(raf.current);
    if (player.current) { try { player.current.pause(); player.current.remove(); } catch {} player.current = null; }
    run.current = null; hits.current = null;
    setNow(-1); setCount(null);
    deactivateKeepAwake('beat');
  };
  useEffect(() => () => {
    stopRun();
    if (tapPlayer.current) { try { tapPlayer.current.remove(); } catch {} tapPlayer.current = null; }
  }, []);

  /** 패턴 파일을 만들어 재생하고, 끝나면 onEnd */
  const start = async (opt: { countIn: boolean; notes: boolean; clicks: boolean }, onEnd: (r: Rendered, h: Hit[] | null) => void) => {
    stopRun();
    setErr('');
    await ensureAudioMode();
    let r: Rendered;
    try { r = renderPattern(l, bpm, opt); } catch (e) { setErr('소리를 만들지 못했어요. 다시 시도해 주세요.'); return false; }
    const p = createAudioPlayer({ uri: r.uri }, { updateInterval: 50 });
    player.current = p; run.current = r; offs.current = [];
    activateKeepAwakeAsync('beat').catch(() => {});
    p.play();
    const tick = () => {
      if (player.current !== p) return;
      const ct = p.currentTime;
      if (p.playing && ct > 0) { offs.current.push(ct - performance.now() / 1000); if (offs.current.length > 90) offs.current.shift(); }
      if (opt.countIn && ct < r.t0) setCount(Math.min(4, Math.max(1, 4 - Math.floor((ct - r.start) / r.beat))));
      else setCount(null);
      const idx = ct >= r.t0 && ct < r.end ? Math.floor((ct - r.t0) / r.step) : -1;
      setNow(idx >= 0 ? idx % r.n : -1);
      setBarNo(idx >= 0 ? Math.min(Math.floor(idx / r.n) + 1, BARS) : 1);
      if (ct > r.end + 0.25 || (!p.playing && ct > r.end)) {
        const h = hits.current;
        stopRun();
        onEnd(r, h);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return true;
  };

  const listen = async () => {
    setPhase('listen');
    const ok = await start({ countIn: false, notes: true, clicks: true }, () => { setListened(true); setPhase('intro'); });
    if (!ok) setPhase('intro');
  };

  const play = async () => {
    setPhase('play'); setResult(null);
    const ok = await start({ countIn: true, notes: false, clicks: clickOn }, (r, h) => {
      const R = evaluate(r, h ?? [], l, MODE, DEFAULT_LATENCY[MODE], false);
      saveScore(l.id, R.score, bpm);
      setResult(R); setPhase('result');
    });
    if (ok) hits.current = [];
    else setPhase('intro');
  };

  const stop = () => { stopRun(); setPhase('intro'); };

  /** 패드 탭: 재생 위치 기준 시각으로 기록 */
  const onPad = () => {
    const t = performance.now() / 1000;
    if (hits.current && offs.current.length) hits.current.push({ t: t + median(offs.current), peak: null });
    try {
      if (!tapPlayer.current) tapPlayer.current = createAudioPlayer({ uri: tapSoundUri() });
      tapPlayer.current.seekTo(0); tapPlayer.current.play();
    } catch {}
    setPadHit(true);
    if (flashT.current) clearTimeout(flashT.current);
    flashT.current = setTimeout(() => setPadHit(false), 90);
  };

  const goHome = () => { stopRun(); router.back(); };
  const busy = phase === 'listen' || phase === 'play';
  const stepOn = phase === 'result' ? 3 : (phase === 'play' || listened) ? 2 : 1;
  const coachKey = phase === 'intro' && listened ? 'ready' : phase;
  const coach: Record<string, string> = {
    intro: '먼저 패턴을 들어보세요. R은 오른손, L은 왼손이에요.',
    listen: '잘 들어보세요. 굵은 음은 악센트예요.',
    ready: `이제 따라 쳐보세요. 카운트 4번 뒤에 ${BARS}마디를 칩니다.`,
    play: '아래 패드를 박자에 맞춰 탭하세요!',
  };

  const steps = (
    <View style={[s.steps, { maxWidth: 200 }]}>
      {[1, 2, 3].map(k => <View key={k} style={[s.seg, { backgroundColor: stepOn >= k ? c.accent : c.line }]} />)}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={page.wrap} scrollEnabled={phase !== 'play'}>
        {phase === 'result' && result ? (
          <>
            <TopBar>
              <IconButton label="레슨 목록" icon="back" onPress={goHome} />
              {steps}
              <View style={{ width: 40 }} />
            </TopBar>
            <ResultView R={result} lesson={l} bpm={bpm} onHome={goHome}
              onRetry={play} onBpm={d => { setBpm(b => b + d); setPhase('intro'); }} />
          </>
        ) : (
          <>
            <TopBar>
              <IconButton label="레슨 목록" icon="back" onPress={goHome} />
              {steps}
              <IconButton label="설정" icon="gear" onPress={() => setErr('설정 화면은 오디오 엔진 단계에서 만들어요.')} />
            </TopBar>

            <H1>{l.title}</H1>

            <View style={s.coach}>
              <View style={[s.av, { backgroundColor: c.ink }]}><T style={{ fontFamily: F.display, fontSize: 14, color: c.bg }}>B</T></View>
              <View style={[s.bubble, { backgroundColor: c.surface, borderColor: c.line }]}>
                <T style={{ lineHeight: 22 }}>{coach[coachKey]}</T>
              </View>
            </View>

            <View style={[s.stage, { backgroundColor: c.surface, borderColor: c.line }]}>
              <View style={s.stagehead}>
                <T style={s.sh(c.muted)}>마디 <T style={s.shb}>{barNo} / {BARS}</T></T>
                <T style={s.sh(c.muted)}><T style={s.shb}>{bpm}</T> BPM · 4/4</T>
              </View>
              <Notation lesson={l} now={now} />
              {count !== null && (
                <View style={[s.countdown, { backgroundColor: c.surface + 'D1' }]} pointerEvents="none">
                  <T style={{ fontFamily: F.display, fontSize: 96, lineHeight: 110, color: c.accent }}>{count}</T>
                </View>
              )}
            </View>

            {!busy && <>
              <View style={s.bpm}>
                <Pressable accessibilityLabel="BPM 낮추기" onPress={() => setBpm(b => Math.max(40, b - 5))} style={[s.round, { backgroundColor: c.surface, borderColor: c.line }]}>
                  <T style={{ fontSize: 20, fontFamily: F.semi, lineHeight: 24 }}>−</T>
                </Pressable>
                <View style={{ alignItems: 'center', minWidth: 64 }}>
                  <T style={{ fontFamily: F.monoBold, fontSize: 28, lineHeight: 34 }}>{bpm}</T>
                  <T style={{ color: c.muted, fontSize: 11, fontFamily: F.medium, marginTop: -4 }}>BPM</T>
                </View>
                <Pressable accessibilityLabel="BPM 올리기" onPress={() => setBpm(b => Math.min(160, b + 5))} style={[s.round, { backgroundColor: c.surface, borderColor: c.line }]}>
                  <T style={{ fontSize: 20, fontFamily: F.semi, lineHeight: 24 }}>+</T>
                </Pressable>
              </View>
              <View style={s.toggle}>
                <View style={{ flex: 1 }}>
                  <T style={{ fontSize: 14 }}>연주할 때 메트로놈 소리</T>
                  <T style={{ fontSize: 12.5, color: c.muted }}>켜두면 박자 잡기가 쉬워요</T>
                </View>
                <Switch on={clickOn} onChange={setClickOn} label="메트로놈 소리" />
              </View>
            </>}

            {phase === 'play' && (
              <Pressable onPressIn={onPad} style={[s.pad, padHit
                ? { backgroundColor: c.accentSoft, borderColor: c.accent }
                : { backgroundColor: c.surface2, borderColor: c.line }]}>
                <T style={{ color: c.muted, fontFamily: F.semi }}>여기를 탭</T>
              </Pressable>
            )}

            <View style={{ gap: 10 }}>
              {busy ? <Button title="멈춤" onPress={stop} />
                : listened ? <>
                    <Button kind="primary" title="따라 치기" onPress={play} />
                    <Button title="다시 듣기" onPress={listen} />
                  </>
                : <>
                    <Button kind="primary" title="듣기" onPress={listen} />
                    <Button kind="ghost" title="바로 따라 치기" onPress={play} />
                  </>}
            </View>
          </>
        )}
      </ScrollView>
      {!!err && (
        <Pressable onPress={() => setErr('')} style={[s.toast, { backgroundColor: c.ink }]}>
          <T style={{ color: c.bg, fontSize: 14 }}>{err}</T>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const s = {
  ...StyleSheet.create({
    steps: { flex: 1, flexDirection: 'row', gap: 6 },
    seg: { flex: 1, height: 4, borderRadius: 4 },
    coach: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    av: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    bubble: { flex: 1, borderWidth: 1, borderRadius: 16, borderTopLeftRadius: 4, paddingVertical: 10, paddingHorizontal: 13 },
    stage: { borderWidth: 1, borderRadius: 20, paddingTop: 18, paddingHorizontal: 12, paddingBottom: 14, gap: 12 },
    stagehead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
    shb: { fontFamily: F.monoBold, fontSize: 12 },
    countdown: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    bpm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
    round: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 4, paddingHorizontal: 2 },
    pad: { height: 150, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    toast: { position: 'absolute', left: 16, right: 16, bottom: 28, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 16 },
  }),
  sh: (muted: string) => ({ fontSize: 12, color: muted }),
};
