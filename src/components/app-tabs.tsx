import { NativeTabs } from 'expo-router/native-tabs';

import { useBeat } from '@/constants/beat-theme';

/** 하단 탭: 홈 · 리그 · 코스 (iOS는 SF Symbols, 안드로이드는 Material Symbols) */
export default function AppTabs() {
  const c = useBeat();
  return (
    <NativeTabs
      backgroundColor={c.surface}
      indicatorColor={c.accentSoft}
      iconColor={{ default: c.muted, selected: c.accent }}
      labelStyle={{ default: { color: c.muted }, selected: { color: c.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="league">
        <NativeTabs.Trigger.Label>리그</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="trophy.fill" md="trophy" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="course">
        <NativeTabs.Trigger.Label>코스</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book.closed.fill" md="menu_book" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
