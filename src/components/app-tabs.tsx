import { NativeTabs } from 'expo-router/native-tabs';

import { useBeat } from '@/constants/beat-theme';

/** 하단 탭: 홈 · 코스 */
export default function AppTabs() {
  const c = useBeat();
  return (
    <NativeTabs
      backgroundColor={c.surface}
      indicatorColor={c.accentSoft}
      labelStyle={{ selected: { color: c.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/home.png')} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="course">
        <NativeTabs.Trigger.Label>코스</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={require('@/assets/images/tabIcons/explore.png')} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
