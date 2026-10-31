/**
 * 레슨 화면: 읽기 카드 / 영상 / 연주.
 * 프로토타입의 vRead / vVideo / vLesson 과 같은 구성과 치수.
 */
import { useVideoPlayer, VideoView } from 'expo-video';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Figure } from '@/components/figures';
import { PlayScreen } from '@/components/play-screen';
import { Button, H1, IconButton, page, T, TopBar } from '@/components/ui';
import { F, useBeat } from '@/constants/beat-theme';
import { findLesson, ReadLesson, VideoLesson } from '@/lib/lessons';
import { useStore } from '@/lib/store';

const VIDEOS: Record<string, number> = {
  'strokes-video': require('@/assets/videos/strokes.mp4'),
};

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = findLesson(id);
  const c = useBeat();
  if (!lesson) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={page.wrap}>
        <T>레슨을 찾을 수 없어요.</T>
        <Button title="돌아가기" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
  if (lesson.kind === 'read') return <ReadScreen lesson={lesson} />;
  if (lesson.kind === 'video') return <VideoScreen lesson={lesson} />;
  return <PlayScreen lesson={lesson} />;
}

function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const c = useBeat();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={[page.wrap, { flexGrow: 1 }]} scrollEnabled={scroll}>{children}</ScrollView>
    </SafeAreaView>
  );
}

/* ---------- 읽기 카드 ---------- */
function ReadScreen({ lesson: l }: { lesson: ReadLesson }) {
  const c = useBeat();
  const { markRead } = useStore();
  const [i, setI] = useState(0);
  const w = useRef(1);
  const n = l.pages.length, pg = l.pages[i], last = i === n - 1;
  const flip = (d: number) => setI(x => Math.max(0, Math.min(n - 1, x + d)));

  return (
    <Screen>
      <TopBar>
        <IconButton label="닫기" icon="close" onPress={() => router.back()} />
        <View style={s.segs}>
          {l.pages.map((_, k) => <View key={k} style={[s.seg, { backgroundColor: k <= i ? c.accent : c.line }]} />)}
        </View>
        <T style={s.pgn(c.muted)}>{i + 1}/{n}</T>
      </TopBar>

      <Pressable style={s.rpage} onLayout={e => { w.current = e.nativeEvent.layout.width; }}
        onPress={e => flip(e.nativeEvent.locationX < w.current * 0.3 ? -1 : 1)}>
        {pg.fig && <View style={[s.rfig, { backgroundColor: c.surface, borderColor: c.line }]}><Figure fig={pg.fig} /></View>}
        <T style={s.rk(c.accent)}>{l.title}</T>
        <H1 size={30}>{pg.t}</H1>
        <T style={{ fontSize: 17, lineHeight: 29 }}>{pg.b}</T>
        <T style={[s.rhint, { color: c.muted }]}>{i === 0 ? '화면을 탭하면 다음 장으로 넘어가요 · 왼쪽을 탭하면 이전 장' : ''}</T>
      </Pressable>

      {last
        ? <Button kind="primary" title="다 읽었어요" onPress={() => { markRead(l); router.back(); }} />
        : <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="이전" onPress={() => flip(-1)} disabled={i === 0} style={{ flex: 1 }} />
            <Button kind="primary" title="다음" onPress={() => flip(1)} style={{ flex: 2 }} />
          </View>}
    </Screen>
  );
}

/* ---------- 영상 ---------- */
function VideoScreen({ lesson: l }: { lesson: VideoLesson }) {
  const c = useBeat();
  const { markRead } = useStore();
  const { width, height } = useWindowDimensions();
  const player = useVideoPlayer(VIDEOS[l.id] ?? null);
  const vh = Math.min(height * 0.62, (Math.min(width - 32, 460) * 16) / 9);
  return (
    <Screen>
      <TopBar>
        <IconButton label="닫기" icon="close" onPress={() => router.back()} />
        <T style={s.pgn(c.muted)}>{l.dur}</T>
      </TopBar>
      <T style={[s.rk(c.accent), { marginTop: 0 }]}>드럼 기초 상식 · 영상</T>
      <H1>{l.title}</H1>
      <View style={s.vwrap}>
        <VideoView player={player} nativeControls contentFit="contain" style={{ height: vh, aspectRatio: 9 / 16, maxWidth: '100%' }} />
      </View>
      <T style={{ fontSize: 16, lineHeight: 26 }}>{l.desc}</T>
      <Button kind="primary" title="다 봤어요" onPress={() => { markRead(l); router.back(); }} />
    </Screen>
  );
}

const s = {
  ...StyleSheet.create({
    segs: { flex: 1, flexDirection: 'row', gap: 4 },
    steps: { flex: 1, flexDirection: 'row', gap: 6 },
    seg: { flex: 1, height: 4, borderRadius: 4 },
    rpage: { flex: 1, gap: 10 },
    rfig: { borderRadius: 22, borderWidth: 1, padding: 14, minHeight: 40 },
    rhint: { marginTop: 'auto', fontSize: 12.5, textAlign: 'center', paddingTop: 16 },
    vwrap: { alignItems: 'center', backgroundColor: '#000', borderRadius: 22, overflow: 'hidden' },
    coach: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    av: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    bubble: { flex: 1, borderWidth: 1, borderRadius: 16, borderTopLeftRadius: 4, paddingVertical: 10, paddingHorizontal: 13 },
    stage: { borderWidth: 1, borderRadius: 20, paddingTop: 18, paddingHorizontal: 12, paddingBottom: 14, gap: 12 },
    stagehead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
    shb: { fontFamily: F.monoBold, fontSize: 12 },
    bpm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
    round: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 4, paddingHorizontal: 2 },
    toast: { position: 'absolute', left: 16, right: 16, bottom: 28, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 16, alignSelf: 'center' },
  }),
  pgn: (muted: string) => ({ fontFamily: F.mono, fontSize: 12, color: muted, minWidth: 32, textAlign: 'right' as const }),
  rk: (accent: string) => ({ fontSize: 13, fontFamily: F.semi, color: accent, marginTop: 6 }),
  sh: (muted: string) => ({ fontSize: 12, color: muted }),
};
