import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { H1, H2, LessonRow, page, T, TopBar } from '@/components/ui';
import { F, useBeat } from '@/constants/beat-theme';
import { BottomTabInset } from '@/constants/theme';
import { LEVELS, UNITS } from '@/lib/lessons';
import { openLesson } from '@/lib/nav';
import { nextLesson, streak, useStore } from '@/lib/store';

export default function HomeScreen() {
  const c = useBeat();
  const { progress, course, days } = useStore();
  const { lesson: l, unitIndex } = nextLesson(course, progress);
  const u = UNITS[unitIndex], lv = LEVELS[u.lv];
  const done = u.items.filter(x => progress[x.id]).length, allDone = done === u.items.length;
  const meta = l.kind === 'video' ? `영상 ${l.dur}` : l.kind === 'read' ? `카드 ${l.pages.length}장` : `${progress[l.id]?.bpm ?? l.bpm} BPM`;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={[page.wrap, { paddingBottom: BottomTabInset + 24 }]}>
        <TopBar>
          <Pressable onPress={() => router.navigate('/course')} style={[s.pill, { backgroundColor: c.surface, borderColor: c.line }]}>
            <T style={{ fontFamily: F.bold }}>{u.title}</T>
            <Icon name="chev" size={16} color={c.muted} />
          </Pressable>
        </TopBar>

        <View style={s.chips}>
          <View style={[s.chip, { backgroundColor: c.surface, borderColor: c.line }]}>
            <T style={{ fontSize: 13, fontFamily: F.medium }}>연속 연습 <T style={{ fontFamily: F.monoBold, fontSize: 13 }}>{streak(days)}</T>일</T>
          </View>
          <View style={[s.chip, { backgroundColor: c.surface, borderColor: c.line }]}>
            <T style={{ fontSize: 13, fontFamily: F.medium }}>휴대폰 마이크</T>
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <T style={{ color: c.muted, fontSize: 13, fontFamily: F.semi }}>{lv.name} · {done}/{u.items.length} 완료</T>
          <H1>{u.title}</H1>
        </View>
        <View style={[s.prog, { backgroundColor: c.surface2 }]}>
          <View style={{ width: `${(done / u.items.length) * 100}%`, height: '100%', backgroundColor: c.accent, borderRadius: 6 }} />
        </View>

        <View style={[s.next, { backgroundColor: c.accent }]}>
          <T style={{ color: c.accentInk, opacity: 0.8, fontSize: 12, fontFamily: F.semi, letterSpacing: 0.7 }}>
            {allDone ? '다시 연습하기' : progress[l.id] ? '이어서' : '다음 레슨'}
          </T>
          <View>
            <T style={{ color: c.accentInk, fontFamily: F.display, fontSize: 30, lineHeight: 35 }}>{l.title}</T>
            <T style={{ color: c.accentInk, opacity: 0.85, fontSize: 14 }}>{l.sub} · {meta}</T>
          </View>
          {l.kind === 'play' && (
            <View style={s.preview}>
              {l.tokens.slice(0, 8).map((t, i) => (
                <View key={i} style={[s.pv, { borderColor: c.accentInk, opacity: 0.9 },
                  t?.accent && { backgroundColor: c.accentInk, opacity: 1 }, !t && { borderStyle: 'dashed', opacity: 0.4 }]}>
                  <T style={{ fontFamily: F.monoBold, fontSize: 12, color: t?.accent ? c.accent : c.accentInk }}>{t?.hand ?? ''}</T>
                </View>
              ))}
            </View>
          )}
          <Pressable onPress={() => openLesson(l.id)} style={({ pressed }) => [s.go, { backgroundColor: c.accentInk, opacity: pressed ? 0.85 : 1 }]}>
            <T style={{ color: c.accent, fontFamily: F.bold, fontSize: 16 }}>시작하기</T>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <H2>이 코스의 레슨</H2>
          <View style={[s.list, { backgroundColor: c.surface, borderColor: c.line }]}>
            {u.items.map((x, k) => (
              <LessonRow key={x.id} lesson={x} index={k} p={progress[x.id]} first={k === 0} onPress={() => openLesson(x.id)} />
            ))}
          </View>
        </View>

        <Pressable onPress={() => router.navigate('/course')} style={{ alignSelf: 'center', padding: 8 }}>
          <T style={{ color: c.accent, fontFamily: F.semi }}>다른 코스 선택하기</T>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1 },
  prog: { height: 6, borderRadius: 6, overflow: 'hidden' },
  next: { borderRadius: 24, padding: 20, gap: 14 },
  preview: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pv: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  go: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  list: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
});
