/** 리그 탭: 내 티어, 이번 주 순위, 승급/강등 구간 */
import { router, useFocusEffect } from 'expo-router';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TierBadge } from '@/components/tier-badge';
import { Button, H1, H2, IconButton, page, T, TopBar } from '@/components/ui';
import { F, useBeat } from '@/constants/beat-theme';
import { BottomTabInset } from '@/constants/theme';
import { LEAGUE, tierIndex, TIERS, timeLeft } from '@/lib/league';
import { useLeague } from '@/lib/league-context';
import { useStore } from '@/lib/store';

function NicknameCard({ onSave }: { onSave: (n: string) => void }) {
  const c = useBeat();
  const [v, setV] = useState('');
  const n = v.trim(), ok = n.length >= 2 && n.length <= 12;
  return (
    <View style={[s.card, { backgroundColor: c.surface, borderColor: c.line }]}>
      <H2>닉네임 정하기</H2>
      <T style={{ color: c.muted, fontSize: 13.5 }}>리그 순위표에 보이는 이름이에요. 2~12자로 정해 주세요.</T>
      <TextInput value={v} onChangeText={setV} maxLength={12} placeholder="예: 그루브장인" placeholderTextColor={c.muted}
        style={[s.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg, fontFamily: F.body }]}
        returnKeyType="done" onSubmitEditing={() => ok && onSave(n)} />
      <Button kind="primary" title="저장" disabled={!ok} onPress={() => onSave(n)} />
    </View>
  );
}

export default function LeagueScreen() {
  const c = useBeat();
  const { profile, setProfile } = useStore();
  const { view: lg, error, loading, refresh, saveNickname } = useLeague();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const ti = tierIndex(lg.tier), tier = TIERS[ti], next = TIERS[ti + 1], top = ti === TIERS.length - 1;
  const [left, setLeft] = useState(timeLeft());
  useEffect(() => { const t = setInterval(() => setLeft(timeLeft()), 30000); return () => clearInterval(t); }, []);

  const n = lg.members.length;
  const promoteN = top ? 0 : Math.min(LEAGUE.promote, n);
  const demoteFrom = ti === 0 ? Infinity : Math.max(n - LEAGUE.demote, LEAGUE.promote) + 1; // 이 등수부터 강등

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={[page.wrap, { paddingBottom: BottomTabInset + 24 }]} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={c.accent} colors={[c.accent]} />}>
        <TopBar>
          <T style={{ fontFamily: F.display, fontSize: 26, letterSpacing: 1 }}>리그</T>
          <IconButton label="설정" icon="gear" onPress={() => router.push('/settings')} />
        </TopBar>

        <View style={s.hero}>
          <TierBadge tier={tier.id} size={84} />
          <H1 size={30}>{tier.name} 리그</H1>
          <T style={{ color: c.muted, textAlign: 'center', maxWidth: 320 }}>
            {top ? '가장 높은 리그예요. 순위를 지켜 보세요.'
              : `이번 주 상위 ${LEAGUE.promote}명은 ${next.name} 리그로 올라가요.`}
          </T>
          <View style={[s.chip, { backgroundColor: c.surface, borderColor: c.line }]}>
            <T style={{ fontSize: 13, fontFamily: F.medium }}>{left}</T>
          </View>
        </View>

        <View style={s.ladder}>
          {TIERS.map((t, i) => (
            <View key={t.id} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
              <TierBadge tier={t.id} size={i === ti ? 40 : 30} dim={i > ti} />
              <T style={{ fontSize: 11, color: i === ti ? c.ink : c.muted, fontFamily: i === ti ? F.bold : F.body }}>{t.name}</T>
            </View>
          ))}
        </View>

        {lg.last && lg.last.result && profile.seenResultWeek !== lg.last.week ? (
          <Pressable onPress={() => setProfile({ seenResultWeek: lg.last!.week })}
            style={[s.card, { backgroundColor: lg.last.result > 0 ? c.perfect : c.surface, borderColor: lg.last.result > 0 ? c.perfect : c.miss }]}>
            <T style={{ fontFamily: F.display, fontSize: 22, color: lg.last.result > 0 ? '#fff' : c.miss }}>
              {lg.last.result > 0 ? `${tier.name} 리그로 승급했어요!` : `${tier.name} 리그로 내려왔어요`}
            </T>
            <T style={{ fontSize: 13.5, color: lg.last.result > 0 ? '#fff' : c.muted }}>
              지난주 {lg.last.points} P를 모았어요. {lg.last.result > 0 ? '이번 주도 힘내요!' : '이번 주에 다시 올라가 봐요.'} (눌러서 닫기)
            </T>
          </Pressable>
        ) : null}

        {!profile.nickname && <NicknameCard onSave={saveNickname} />}

        <View style={{ gap: 8 }}>
          <H2>이번 주 순위</H2>
          {n === 0 ? (
            <View style={[s.card, { backgroundColor: c.surface, borderColor: c.line, alignItems: 'center' }]}>
              <T style={{ fontFamily: F.semi, textAlign: 'center' }}>이번 주 첫 포인트를 얻으면 리그에 들어가요</T>
              <T style={{ color: c.muted, fontSize: 13.5, textAlign: 'center' }}>레슨을 끝내거나 따라 치기를 하면 포인트가 쌓여요.</T>
              <Button kind="primary" title="연습하러 가기" onPress={() => router.navigate('/')} style={{ alignSelf: 'stretch' }} />
            </View>
          ) : (
            <View style={[s.list, { backgroundColor: c.surface, borderColor: c.line }]}>
              {lg.members.map((m, i) => {
                const rank = i + 1, isMe = m.id === lg.me;
                const up = rank <= promoteN, down = rank >= demoteFrom;
                return (
                  <Fragment key={m.id}>
                    {rank === demoteFrom && <Zone label="▼ 강등 구간" color={c.miss} />}
                    <View style={[s.row, i > 0 && rank !== demoteFrom && { borderTopWidth: 1, borderTopColor: c.line },
                      isMe && { backgroundColor: c.accentSoft }]}>
                      <T style={{ width: 26, textAlign: 'center', fontFamily: F.monoBold, color: up ? c.perfect : down ? c.miss : c.muted }}>{rank}</T>
                      <View style={[s.av, { backgroundColor: isMe ? c.accent : c.surface2 }]}>
                        <T style={{ fontFamily: F.bold, color: isMe ? c.accentInk : c.ink }}>{m.nickname.slice(0, 1)}</T>
                      </View>
                      <T style={{ flex: 1, fontFamily: isMe ? F.bold : F.medium }} numberOfLines={1}>{m.nickname}{isMe ? ' (나)' : ''}</T>
                      <T style={{ fontFamily: F.monoBold, fontSize: 14 }}>{m.points} P</T>
                    </View>
                    {rank === promoteN && rank < n && <Zone label="▲ 승급 구간" color={c.perfect} />}
                  </Fragment>
                );
              })}
            </View>
          )}
          {!lg.online && (
            <T style={{ color: c.muted, fontSize: 12.5, textAlign: 'center' }}>
              {error ? `서버에 연결하지 못해서 내 기록만 보여요. 아래로 당겨서 다시 시도해 보세요.` : '서버에 연결하는 중이에요…'}
            </T>
          )}
          {!!error && <T style={{ color: c.miss, fontSize: 12, textAlign: 'center' }}>{error}</T>}
        </View>

        <View style={[s.card, { backgroundColor: c.surface, borderColor: c.line }]}>
          <H2>포인트 얻는 법</H2>
          {[['연주', '점수에 따라 5~20 P'], ['읽기 카드 · 영상 첫 완료', '10 P'], ['기본보다 빠른 BPM으로 80점 이상', '+5 P'], ['그날 첫 연습', '+5 P']].map(([a, b]) => (
            <View key={a} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <T style={{ fontSize: 14, flex: 1 }}>{a}</T>
              <T style={{ fontSize: 13, fontFamily: F.semi, color: c.accent }}>{b}</T>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Zone({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.zone, { borderColor: color }]}>
      <T style={{ fontSize: 12, fontFamily: F.semi, color }}>{label}</T>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingTop: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, marginTop: 4 },
  ladder: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  list: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12 },
  av: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  zone: { borderTopWidth: 1, borderBottomWidth: 1, borderStyle: 'dashed', paddingVertical: 4, alignItems: 'center' },
});
