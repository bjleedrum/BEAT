/** 결과 화면 (프로토타입 vResult / vChart) */
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Notation } from '@/components/notation';
import { Button, H2, T } from '@/components/ui';
import { BeatPalette, F, useBeat } from '@/constants/beat-theme';
import { BARS, PlayLesson } from '@/lib/lessons';
import { Result, Tip, tips } from '@/lib/scoring';

function Chart({ R, c }: { R: Result; c: BeatPalette }) {
  const W = 340, H = 150, pad = 28, top = 14, bot = H - 22, mid = (top + bot) / 2, sc = (bot - top) / 2 / 100, n = R.res.length;
  const x = (i: number) => pad + (n === 1 ? 0 : (W - pad - 8) * (i / (n - 1)));
  const y = (o: number) => mid - Math.max(-100, Math.min(100, o)) * sc;
  const col = { perfect: c.perfect, good: c.good, early: c.off, late: c.off, miss: c.miss };
  const barN = R.res.filter(r => r.bar === 0).length;
  return (
    <View style={[s.chart, { backgroundColor: c.surface, borderColor: c.line }]}>
      <Svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ aspectRatio: W / H }}>
        <Rect x={pad} y={y(40)} width={W - pad - 8} height={y(-40) - y(40)} fill={c.perfect} opacity={0.1} />
        {[100, 50, 0, -50, -100].map(v => (
          <G key={v}>
            <Line x1={pad} x2={W - 8} y1={y(v)} y2={y(v)} stroke={c.line} strokeWidth={v ? 1 : 1.5} />
            <SvgText x={pad - 5} y={y(v) + 3.5} textAnchor="end" fontSize={9} fill={c.muted} fontFamily={F.mono}>{`${v > 0 ? '+' : ''}${v}`}</SvgText>
          </G>
        ))}
        {barN < n && <Line x1={(x(barN - 1) + x(barN)) / 2} x2={(x(barN - 1) + x(barN)) / 2} y1={top} y2={bot} stroke={c.line} strokeDasharray="3 3" />}
        {R.res.map((r, i) => r.off === null
          ? <Path key={i} d={`M${x(i) - 4} ${mid - 4}L${x(i) + 4} ${mid + 4}M${x(i) + 4} ${mid - 4}L${x(i) - 4} ${mid + 4}`} stroke={c.miss} strokeWidth={2} fill="none" />
          : <G key={i}>
              <Line x1={x(i)} x2={x(i)} y1={mid} y2={y(r.off)} stroke={col[r.grade]} strokeWidth={2} opacity={0.5} />
              <Circle cx={x(i)} cy={y(r.off)} r={n > 20 ? 3.5 : 4.5} fill={col[r.grade]} />
            </G>)}
        <SvgText x={pad} y={H - 6} fontSize={10} fill={c.muted} fontFamily={F.body}>위쪽 = 늦게 침 · 아래쪽 = 빨리 침 (ms)</SvgText>
      </Svg>
    </View>
  );
}

const TIP_COLOR = (c: BeatPalette, t: Tip['tone']) =>
  t === 'perfect' ? c.perfect : t === 'off' ? c.off : t === 'miss' ? c.miss : t === 'muted' ? c.muted : c.accent;

export function ResultView({ R, lesson: l, bpm, onRetry, onBpm, onHome }:
  { R: Result; lesson: PlayLesson; bpm: number; onRetry: () => void; onBpm: (d: number) => void; onHome: () => void }) {
  const c = useBeat();
  const word = R.score >= 90 ? ['완벽해요', '박자가 아주 안정적이에요'] : R.score >= 75 ? ['좋아요', '조금만 다듬으면 돼요']
    : R.score >= 50 ? ['조금만 더', '한 번 더 해볼까요'] : ['다시 해봐요', 'BPM을 낮춰보세요'];
  const ms = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v)}`;
  const stat = (n: number, label: string, color: string) => (
    <View style={[s.stat, { backgroundColor: c.surface, borderColor: c.line }]}>
      <T style={{ fontFamily: F.monoBold, fontSize: 20, color }}>{n}</T>
      <T style={{ fontSize: 12, color: c.muted }}>{label}</T>
    </View>
  );
  const metric = (label: string, v: string) => <T style={{ fontSize: 13, color: c.muted }}>{label} <T style={{ fontFamily: F.monoBold, fontSize: 13 }}>{v}</T></T>;

  return (
    <>
      <H2>{l.title} · {bpm} BPM</H2>
      <View style={s.score}>
        <T style={{ fontFamily: F.display, fontSize: 84, lineHeight: 84 }}>{R.score}</T>
        <T style={{ fontFamily: F.mono, color: c.muted, paddingBottom: 10 }}>/100</T>
        <View style={{ marginLeft: 'auto', alignItems: 'flex-end', paddingBottom: 8 }}>
          <T style={{ fontFamily: F.bold, fontSize: 18 }}>{word[0]}</T>
          <T style={{ fontSize: 12, color: c.muted, fontFamily: F.medium }}>{word[1]}</T>
        </View>
      </View>
      <View style={s.stats}>
        {stat(R.counts.perfect, '정확', c.perfect)}{stat(R.counts.good, '좋음', c.good)}
        {stat(R.counts.off, '빠름·늦음', c.off)}{stat(R.counts.miss, '놓침', c.miss)}
      </View>
      <View style={s.metrics}>
        {metric('평균', `${ms(R.mean)}ms`)}{metric('편차', `±${Math.round(R.sd)}ms`)}
        {R.acc ? metric('악센트', `${R.acc.ok}/${R.acc.total}`) : metric('잡음', String(R.extras))}
      </View>
      <View style={[s.stage, { backgroundColor: c.surface, borderColor: c.line }]}>
        {Array.from({ length: BARS }, (_, b) => <Notation key={b} lesson={l} bar={b} graded={R.res} />)}
      </View>
      <Chart R={R} c={c} />
      <View style={{ gap: 8 }}>
        {tips(R, l).map((t, i) => (
          <View key={i} style={[s.tip, { backgroundColor: c.surface, borderColor: c.line }]}>
            <View style={{ width: 6, borderRadius: 6, backgroundColor: TIP_COLOR(c, t.tone) }} />
            <T style={{ flex: 1, fontSize: 14, lineHeight: 21 }}>{t.text}</T>
          </View>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <Button kind="primary" title="다시 하기" onPress={onRetry} />
        {R.score >= 80 && bpm < 160 && <Button title={`BPM ${bpm + 5}로 도전`} onPress={() => onBpm(5)} />}
        {R.score < 50 && bpm > 40 && <Button title={`BPM ${bpm - 5}로 연습`} onPress={() => onBpm(-5)} />}
        <Button kind="ghost" title="레슨 목록" onPress={onHome} />
      </View>
    </>
  );
}

const s = StyleSheet.create({
  score: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingHorizontal: 4 },
  stage: { borderWidth: 1, borderRadius: 20, paddingTop: 18, paddingHorizontal: 12, paddingBottom: 14, gap: 12 },
  chart: { borderWidth: 1, borderRadius: 18, paddingTop: 12, paddingHorizontal: 8, paddingBottom: 6 },
  tip: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 13 },
});
