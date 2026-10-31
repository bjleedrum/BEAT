/** 여러 화면에서 같이 쓰는 부품. 스타일 값은 프로토타입 CSS와 같게 맞춤 */
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextProps, View, ViewStyle } from 'react-native';

import { F, useBeat } from '@/constants/beat-theme';
import { Icon, IconName } from '@/components/icons';
import { Lesson } from '@/lib/lessons';
import { LessonProgress } from '@/lib/store';
import { starsFor } from '@/lib/scoring';

/** 기본 글꼴(IBM Plex Sans KR 15px)을 깔고 쓰는 Text */
export function T({ style, ...p }: TextProps) {
  const c = useBeat();
  return <Text {...p} style={[{ fontFamily: F.body, fontSize: 15, color: c.ink }, style]} />;
}

/** 제목 (h1: Black Han Sans 28px, line-height 1.2) */
export function H1({ size = 28, style, ...p }: TextProps & { size?: number }) {
  return <T {...p} style={[{ fontFamily: F.display, fontSize: size, lineHeight: Math.round(size * 1.2) }, style]} />;
}

/** 소제목 (h2: 13px 600, 자간 .06em, muted) */
export function H2({ style, ...p }: TextProps) {
  const c = useBeat();
  return <T {...p} style={[{ fontFamily: F.semi, fontSize: 13, letterSpacing: 0.8, color: c.muted }, style]} />;
}

export function IconButton({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  const c = useBeat();
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} hitSlop={6}
      style={({ pressed }) => [s.icon, { backgroundColor: pressed ? c.surface2 : c.surface, borderColor: c.line }]}>
      <Icon name={icon} />
    </Pressable>
  );
}

/** 상단 줄: 왼쪽 · 가운데(늘어남) · 오른쪽 */
export function TopBar({ children }: { children: ReactNode }) {
  return <View style={s.top}>{children}</View>;
}

type BtnKind = 'primary' | 'default' | 'ghost';
export function Button({ title, onPress, kind = 'default', disabled, style }:
  { title: string; onPress: () => void; kind?: BtnKind; disabled?: boolean; style?: ViewStyle }) {
  const c = useBeat();
  const bg = kind === 'primary' ? c.accent : kind === 'ghost' ? 'transparent' : c.surface;
  const fg = kind === 'primary' ? c.accentInk : kind === 'ghost' ? c.muted : c.ink;
  const bc = kind === 'primary' ? c.accent : kind === 'ghost' ? 'transparent' : c.line;
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, borderColor: bc, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        kind === 'ghost' && { height: 44 }, style]}>
      <T style={{ color: fg, fontFamily: F.semi, fontSize: 16 }}>{title}</T>
    </Pressable>
  );
}

/** 켜고 끄는 스위치 (46×28) */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  const c = useBeat();
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label}
      onPress={() => onChange(!on)} style={[s.sw, { backgroundColor: on ? c.accent : c.line }]}>
      <View style={[s.knob, { backgroundColor: c.surface, left: on ? 21 : 3 }]} />
    </Pressable>
  );
}

export function Stars({ score }: { score: number }) {
  const c = useBeat(), n = starsFor(score);
  return (
    <T style={{ letterSpacing: 2, fontSize: 13 }}>
      <T style={{ color: c.accent, fontSize: 13 }}>{'★'.repeat(n)}</T>
      <T style={{ color: c.line, fontSize: 13 }}>{'★'.repeat(3 - n)}</T>
    </T>
  );
}

/** 레슨 목록 한 줄 */
export function LessonRow({ lesson, index, p, first, onPress }:
  { lesson: Lesson; index: number; p?: LessonProgress; first: boolean; onPress: () => void }) {
  const c = useBeat();
  let right: ReactNode;
  const small = { color: c.muted, fontSize: 12, fontFamily: F.mono, textAlign: 'right' as const };
  const doneTxt = { color: c.accent, fontSize: 13, letterSpacing: 2 };
  if (lesson.kind === 'video') right = <T style={p ? doneTxt : small}>{p ? '봤음' : `▶ 영상 ${lesson.dur}`}</T>;
  else if (lesson.kind === 'read') right = <T style={p ? doneTxt : small}>{p ? '읽음' : `카드 ${lesson.pages.length}장`}</T>;
  else if (p?.best != null) right = <View style={{ alignItems: 'flex-end' }}><Stars score={p.best} /><T style={small}>{p.best}점 · {p.bpm}</T></View>;
  else right = <T style={small}>{lesson.bpm} BPM</T>;
  return (
    <Pressable onPress={onPress}
      style={({ pressed }) => [s.lrow, !first && { borderTopWidth: 1, borderTopColor: c.line }, pressed && { backgroundColor: c.surface2 }]}>
      <View style={[s.num, { backgroundColor: p ? c.accent : c.surface2 }]}>
        <T style={{ fontFamily: F.monoBold, fontSize: 14, color: p ? c.accentInk : c.ink }}>{index + 1}</T>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T style={{ fontFamily: F.semi }}>{lesson.title}</T>
        <T style={{ color: c.muted, fontSize: 13 }}>{lesson.sub}</T>
      </View>
      {right}
    </Pressable>
  );
}

/** 화면 공통 여백: 좌우 16, 위 14, 아래 40, 요소 사이 18, 최대 폭 460 */
export const page = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40, gap: 18, maxWidth: 460 + 32, width: '100%', alignSelf: 'center' },
});

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 40 },
  icon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btn: { height: 54, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sw: { width: 46, height: 28, borderRadius: 999 },
  knob: { position: 'absolute', top: 3, width: 22, height: 22, borderRadius: 11 },
  lrow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  num: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
