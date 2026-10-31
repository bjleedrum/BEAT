/** 마이크 레벨 미터 + 타격 점 (프로토타입 .micring / .meter / .dot) */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { useBeat } from '@/constants/beat-theme';
import { levelToUnit, useMic } from '@/lib/mic';

export function MicMeter({ showThreshold, label }: { showThreshold?: boolean; label?: string }) {
  const c = useBeat();
  const mic = useMic();
  const [lv, setLv] = useState(0);
  const [hit, setHit] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const a = mic.onLevel(v => setLv(levelToUnit(v)));
    const b = mic.onHit(() => {
      setHit(true);
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => setHit(false), 90);
    });
    return () => { a(); b(); };
  }, [mic]);
  return (
    <View style={s.row}>
      <View style={[s.dot, { backgroundColor: hit ? c.accent : c.line }, hit && { transform: [{ scale: 1.5 }] }]} />
      {!!label && <T style={{ fontSize: 14 }}>{label}</T>}
      <View style={[s.meter, { backgroundColor: c.surface2 }]}>
        <View style={[s.fill, { width: `${lv * 100}%`, backgroundColor: c.accent }]} />
        {showThreshold && <View style={[s.mark, { left: `${levelToUnit(mic.threshold()) * 100}%`, backgroundColor: c.ink }]} />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  meter: { flex: 1, height: 8, borderRadius: 8, overflow: 'visible' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 8 },
  mark: { position: 'absolute', top: -2, bottom: -2, width: 2 },
});
