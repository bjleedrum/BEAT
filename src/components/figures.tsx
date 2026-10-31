/**
 * 읽기 카드 그림 (프로토타입의 figKit / figStick / figStroke / figPosture 를 그대로 옮김)
 * fig 문자열: 'kit:snare', 'stick:f', 'stroke:full', 'posture', 'note:quarter'
 */
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Notation } from '@/components/notation';
import { BeatPalette, F, useBeat } from '@/constants/beat-theme';
import { findLesson } from '@/lib/lessons';

type C = BeatPalette;

function Label({ c, x, y, t, anchor = 'middle', acc }: { c: C; x: number; y: number; t: string; anchor?: 'start' | 'middle' | 'end'; acc?: boolean }) {
  return <SvgText x={x} y={y} textAnchor={anchor} fontSize={12} fontFamily={F.semi} fill={acc ? c.accent : c.ink}>{t}</SvgText>;
}

const KIT_LABEL: Record<string, [string, number, number]> = {
  crash: ['크래시', 78, 26], ride: ['라이드', 262, 44], hihat: ['하이햇', 30, 84], tom: ['탐탐', 160, 66],
  snare: ['스네어', 89, 176], kick: ['킥', 160, 163], floor: ['플로어 탐', 256, 198],
};

function Kit({ c, hl }: { c: C; hl: string }) {
  const part = (k: string) => k === hl ? { fill: c.accent, stroke: c.accent, strokeWidth: 1.5 } : { fill: c.surface2, stroke: c.muted, strokeWidth: 1.5 };
  const drum = (k: string, x: number, y: number, w: number, h: number, key: string) => (
    <G key={key}>
      <Rect x={x} y={y} width={w} height={h} rx={3} {...part(k)} />
      <Ellipse cx={x + w / 2} cy={y} rx={w / 2} ry={Math.max(5, w * 0.12)} {...part(k)} />
    </G>
  );
  const stand = { stroke: c.line, strokeWidth: 2 };
  return (
    <Svg viewBox="0 0 320 222" width="100%" style={{ aspectRatio: 320 / 222 }}>
      <G {...stand}>
        <Line x1={78} y1={44} x2={78} y2={214} /><Line x1={262} y1={62} x2={262} y2={214} /><Line x1={30} y1={96} x2={30} y2={214} />
        <Line x1={89} y1={150} x2={74} y2={214} /><Line x1={89} y1={150} x2={104} y2={214} />
        <Line x1={236} y1={180} x2={232} y2={214} /><Line x1={276} y1={180} x2={280} y2={214} /><Line x1={10} y1={214} x2={310} y2={214} />
      </G>
      <Ellipse cx={78} cy={42} rx={40} ry={6} {...part('crash')} />
      <Ellipse cx={262} cy={60} rx={46} ry={7} {...part('ride')} />
      <Circle cx={160} cy={160} r={52} {...part('kick')} />
      <Circle cx={160} cy={160} r={40} fill="none" stroke={hl === 'kick' ? c.accentInk : c.muted} strokeWidth={1.5} opacity={hl === 'kick' ? 0.5 : 1} />
      {drum('tom', 112, 86, 40, 28, 't1')}{drum('tom', 168, 86, 40, 28, 't2')}
      {drum('snare', 58, 130, 62, 20, 'sn')}{drum('floor', 228, 132, 56, 48, 'fl')}
      <Ellipse cx={30} cy={98} rx={27} ry={4} {...part('hihat')} />
      <Ellipse cx={30} cy={104} rx={27} ry={4} {...part('hihat')} />
      {!hl && Object.entries(KIT_LABEL).map(([k, [t, x, y]]) => <Label key={k} c={c} x={x} y={y} t={t} />)}
    </Svg>
  );
}

function Stick({ c, f }: { c: C; f: boolean }) {
  const dim = { stroke: c.accent, strokeWidth: 1.5 };
  return (
    <Svg viewBox="0 0 320 132" width="100%" style={{ aspectRatio: 320 / 132 }}>
      <Path d="M22 66 L292 60 Q304 62 292 70 L22 76 Q16 71 22 66Z" fill={c.surface2} stroke={c.ink} strokeWidth={1.5} />
      <Label c={c} x={22} y={98} t="손잡이 끝" anchor="start" />
      <Label c={c} x={298} y={98} t="팁 (치는 쪽)" anchor="end" />
      {f && <>
        <Line x1={22} y1={40} x2={112} y2={40} {...dim} /><Line x1={22} y1={34} x2={22} y2={46} {...dim} /><Line x1={112} y1={34} x2={112} y2={46} {...dim} />
        <Label c={c} x={67} y={30} t="약 1/3" />
        <Circle cx={112} cy={68} r={11} fill={c.accent} opacity={0.85} />
        <Label c={c} x={112} y={122} t="받침점 (엄지 + 검지)" acc />
      </>}
    </Svg>
  );
}

function Stroke({ c, hl }: { c: C; hl: string }) {
  const T: Record<string, [string, 'H' | 'L', 'H' | 'L']> = { full: ['풀', 'H', 'H'], down: ['다운', 'H', 'L'], tap: ['탭', 'L', 'L'], up: ['업', 'L', 'H'] };
  const Y = { H: 28, L: 104 }, pad = 132;
  return (
    <Svg viewBox="0 0 320 160" width="100%" style={{ aspectRatio: 320 / 160 }}>
      <Line x1={10} y1={pad} x2={310} y2={pad} stroke={c.ink} strokeWidth={3} strokeLinecap="round" />
      <Label c={c} x={12} y={Y.H + 4} t="높게" anchor="start" />
      <Label c={c} x={12} y={Y.L + 4} t="낮게" anchor="start" />
      {Object.entries(T).map(([k, [n, a, b]], i) => {
        const x = 88 + i * 62, on = !hl || k === hl, col = k === hl ? c.accent : c.muted;
        const ln = { stroke: col, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
        return (
          <G key={k} opacity={on ? 1 : 0.35}>
            <Circle cx={x - 14} cy={Y[a]} r={5} fill={col} />
            <Path d={`M${x - 14} ${Y[a]} L${x} ${pad - 4} L${x + 14} ${Y[b]}`} {...ln} />
            <Path d={`M${x + 14} ${Y[b]} l-7 3 M${x + 14} ${Y[b]} l-1 8`} {...ln} />
            <Label c={c} x={x} y={pad + 20} t={n} />
          </G>
        );
      })}
    </Svg>
  );
}

function Posture({ c }: { c: C }) {
  const kpf = { fill: c.surface2, stroke: c.muted, strokeWidth: 1.5 };
  const ln2 = { stroke: c.muted, strokeWidth: 2 };
  const body = { fill: 'none', stroke: c.ink, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg viewBox="0 0 320 210" width="100%" style={{ aspectRatio: 320 / 210 }}>
      <Line x1={10} y1={200} x2={310} y2={200} stroke={c.ink} strokeWidth={3} strokeLinecap="round" />
      <Rect x={70} y={128} width={64} height={12} rx={6} {...kpf} />
      <Line x1={102} y1={140} x2={102} y2={200} {...ln2} /><Line x1={82} y1={200} x2={122} y2={200} {...ln2} />
      <Circle cx={104} cy={44} r={15} {...kpf} />
      <Path d="M104 60 L104 124 L172 126 L176 194 L198 196" {...body} />
      <Path d="M104 74 L132 104 L178 98" {...body} />
      <Line x1={178} y1={98} x2={230} y2={108} stroke={c.accent} strokeWidth={4} strokeLinecap="round" />
      <Rect x={214} y={110} width={58} height={16} rx={3} {...kpf} />
      <Ellipse cx={243} cy={110} rx={29} ry={5} {...kpf} />
      <Line x1={243} y1={126} x2={243} y2={200} {...ln2} />
      <Label c={c} x={166} y={156} t="허벅지 수평 →" anchor="end" acc />
      <Label c={c} x={104} y={22} t="허리는 곧게" />
    </Svg>
  );
}

/** 그림이 없는 카드면 null */
export function Figure({ fig }: { fig: string | null }) {
  const c = useBeat();
  if (!fig) return null;
  const [k, v = ''] = fig.split(':');
  if (k === 'kit') return <Kit c={c} hl={v} />;
  if (k === 'stick') return <Stick c={c} f={v === 'f'} />;
  if (k === 'stroke') return <Stroke c={c} hl={v} />;
  if (k === 'posture') return <Posture c={c} />;
  if (k === 'note') {
    const l = findLesson(v);
    if (l?.kind === 'play') return <View style={{ paddingTop: 4 }}><Notation lesson={l} /></View>;
  }
  return null;
}
