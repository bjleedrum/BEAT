/** 설정 (프로토타입 vSettings 중 입력 방식 · 감도. 테마와 지연 보정은 다음 단계) */
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MicMeter } from '@/components/mic-meter';
import { Button, H2, IconButton, page, T, TopBar } from '@/components/ui';
import { F, useBeat } from '@/constants/beat-theme';
import { useMic } from '@/lib/mic';
import { InputMode, useStore } from '@/lib/store';

function Seg({ value, onChange }: { value: InputMode; onChange: (m: InputMode) => void }) {
  const c = useBeat();
  const item = (m: InputMode, label: string) => {
    const on = value === m;
    return (
      <Pressable key={m} onPress={() => onChange(m)} accessibilityState={{ selected: on }}
        style={[s.segBtn, on && { backgroundColor: c.surface, elevation: 1, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }]}>
        <T style={{ fontFamily: F.semi, fontSize: 14, color: on ? c.ink : c.muted }}>{label}</T>
      </Pressable>
    );
  };
  return <View style={[s.seg, { backgroundColor: c.surface2 }]}>{item('mic', '휴대폰 마이크')}{item('tap', '화면 탭')}</View>;
}

/** 1~10 슬라이더 (탭하거나 끌어서 조절) */
function Slider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const c = useBeat();
  const w = useRef(1);
  const pick = (x: number) => onChange(Math.max(1, Math.min(10, Math.round((x / w.current) * 9) + 1)));
  const pct = ((value - 1) / 9) * 100;
  return (
    <View style={s.slider} onLayout={e => { w.current = e.nativeEvent.layout.width; }}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
      onResponderGrant={e => pick(e.nativeEvent.locationX)} onResponderMove={e => pick(e.nativeEvent.locationX)}
      accessibilityRole="adjustable" accessibilityLabel="감도" accessibilityValue={{ min: 1, max: 10, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => onChange(Math.max(1, Math.min(10, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}>
      <View pointerEvents="none" style={[s.track, { backgroundColor: c.line }]}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: c.accent, borderRadius: 4 }} />
      </View>
      <View pointerEvents="none" style={[s.thumb, { left: `${pct}%`, backgroundColor: c.accent }]} />
    </View>
  );
}

export default function SettingsScreen() {
  const c = useBeat();
  const mic = useMic();
  const { settings, setSettings } = useStore();
  const [micOn, setMicOn] = useState(mic.isOn());
  const [status, setStatus] = useState('');
  const m = settings.mode;

  // 설정 화면을 나가면 마이크를 끈다 (레슨에서 다시 켬)
  const micRef = useRef(mic);
  micRef.current = mic;
  useEffect(() => () => micRef.current.stop(), []);

  const turnOn = async () => {
    const ok = await mic.start();
    setMicOn(ok);
    setStatus(ok ? '' : '마이크를 켜지 못했어요. 앱 권한에서 마이크를 허용해 주세요.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={page.wrap}>
        <TopBar>
          <IconButton label="뒤로" icon="back" onPress={() => router.back()} />
          <T style={{ fontFamily: F.semi }}>설정</T>
          <View style={{ width: 40 }} />
        </TopBar>

        <View style={[s.card, { backgroundColor: c.surface, borderColor: c.line }]}>
          <H2>입력 방식</H2>
          <Seg value={m} onChange={v => setSettings({ mode: v })} />
          <T style={s.hint(c.muted)}>
            {m === 'mic' ? '연습패드나 스네어를 치면 마이크로 타격을 감지해요. 휴대폰은 패드에서 30–50cm 떨어진 곳에 두세요.'
              : '마이크 없이 화면을 손가락으로 탭해서 연습해요. 세기(악센트)는 평가하지 않아요.'}
          </T>
        </View>

        {m === 'mic' && (
          <View style={[s.card, { backgroundColor: c.surface, borderColor: c.line }]}>
            <H2>감도</H2>
            {micOn ? <>
              <MicMeter showThreshold />
              <Slider value={settings.sens} onChange={v => setSettings({ sens: v })} />
              <T style={s.hint(c.muted)}>패드를 쳤을 때만 점이 켜지면 적당해요. 말소리에도 켜지면 감도를 낮추고, 약하게 칠 때 안 켜지면 올리세요.</T>
            </> : <>
              <Button title="마이크 켜기" onPress={turnOn} />
              <T style={s.hint(c.muted)}>마이크 권한을 물어보면 허용해 주세요.</T>
            </>}
            {!!status && <T style={{ fontSize: 13.5, color: c.miss }}>{status}</T>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = {
  ...StyleSheet.create({
    card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
    seg: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14 },
    segBtn: { flex: 1, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    slider: { height: 32, justifyContent: 'center' },
    track: { height: 4, borderRadius: 4, overflow: 'hidden' },
    thumb: { position: 'absolute', width: 20, height: 20, borderRadius: 10, marginLeft: -10, top: 6 },
  }),
  hint: (muted: string) => ({ fontSize: 12.5, color: muted, lineHeight: 19 }),
};
