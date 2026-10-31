import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { H1, page, T, TopBar } from '@/components/ui';
import { F, useBeat } from '@/constants/beat-theme';
import { BottomTabInset } from '@/constants/theme';
import { LEVELS, UNITS } from '@/lib/lessons';
import { currentUnitIndex, useStore } from '@/lib/store';

export default function CourseScreen() {
  const c = useBeat();
  const { progress, course, setCourse } = useStore();
  const cur = currentUnitIndex(course, progress);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={[page.wrap, { paddingBottom: BottomTabInset + 24 }]}>
        <TopBar>
          <T style={{ fontFamily: F.display, fontSize: 26, letterSpacing: 1 }}>코스</T>
        </TopBar>
        {LEVELS.map((lv, li) => (
          <Fragment key={lv.code}>
            <View style={s.level}>
              <View style={[s.badge, { backgroundColor: c.accentSoft }]}>
                <T style={{ color: c.accent, fontFamily: F.bold, fontSize: 14 }}>{lv.code}</T>
              </View>
              <H1 size={30}>{lv.name}</H1>
              <T style={{ color: c.muted, textAlign: 'center', maxWidth: 320 }}>
                <T style={{ fontFamily: F.bold }}>{lv.code}:</T> {lv.desc}
              </T>
            </View>
            {UNITS.map((u, ui) => {
              if (u.lv !== li) return null;
              const done = u.items.filter(x => progress[x.id]).length, full = done === u.items.length, sel = ui === cur;
              return (
                <Pressable key={u.id} onPress={() => { setCourse(u.id); router.navigate('/'); }}
                  style={({ pressed }) => [s.card, { backgroundColor: pressed ? c.surface2 : c.surface, borderColor: sel ? c.accent : 'transparent' }]}>
                  <View style={s.row}>
                    <View style={[s.row, { gap: 8, flex: 1, justifyContent: 'flex-start' }]}>
                      <T style={{ fontSize: 19, fontFamily: F.bold, color: full ? c.muted : c.ink, flexShrink: 1 }}>{u.title}</T>
                      {full && <View style={[s.ok, { backgroundColor: c.perfect }]}><T style={{ color: '#fff', fontFamily: F.bold, fontSize: 14 }}>✓</T></View>}
                    </View>
                    <View style={[s.lv, { backgroundColor: c.surface2 }]}><T style={{ fontSize: 13, fontFamily: F.semi }}>{lv.code}</T></View>
                  </View>
                  <T style={{ lineHeight: 23 }}>{u.desc}</T>
                  <View style={s.row}>
                    <T style={{ color: c.accent, fontFamily: F.bold, fontSize: 16 }}>{sel ? '학습 중' : '선택'}</T>
                    <T style={{ color: c.muted, fontSize: 12, fontFamily: F.mono }}>{done}/{u.items.length} 레슨</T>
                  </View>
                </Pressable>
              );
            })}
          </Fragment>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  level: { alignItems: 'center', gap: 8, paddingTop: 22, paddingBottom: 4, paddingHorizontal: 8 },
  badge: { minWidth: 48, height: 48, paddingHorizontal: 8, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  card: { gap: 10, borderRadius: 24, borderWidth: 2, padding: 18, paddingBottom: 16, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ok: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lv: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999 },
});
