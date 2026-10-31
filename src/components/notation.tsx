/** 한 마디 악보: 4박 × spb칸. 손(R/L), 악센트(>), 쉼표, 박 세기, 판정 색 */
import { StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { BeatPalette, F, useBeat } from '@/constants/beat-theme';
import { countLabel, PlayLesson } from '@/lib/lessons';
import type { NoteResult } from '@/lib/scoring';

type Props = { lesson: PlayLesson; bar?: number; graded?: NoteResult[]; now?: number };

function gradeColor(c: BeatPalette, g: NoteResult['grade']) {
  return g === 'perfect' ? c.perfect : g === 'good' ? c.good : g === 'miss' ? c.miss : c.off;
}

export function Notation({ lesson, bar = 0, graded, now = -1 }: Props) {
  const c = useBeat();
  return (
    <View style={s.bar}>
      {[0, 1, 2, 3].map(b => (
        <View key={b} style={[s.beat, { borderTopColor: c.line }]}>
          {Array.from({ length: lesson.spb }, (_, k) => {
            const i = b * lesson.spb + k, tk = lesson.tokens[i], isNow = i === now;
            const r = tk ? graded?.find(x => x.bar === bar && x.i === i) : undefined;
            let bg = tk?.accent ? c.ink : tk?.hand === 'L' ? c.surface2 : c.surface;
            let border = c.ink, fg = tk?.accent ? c.bg : c.ink, dashed = false;
            if (isNow) { bg = border = c.accent; fg = c.accentInk; }
            if (r) {
              const gc = gradeColor(c, r.grade);
              if (r.grade === 'miss') { bg = 'transparent'; border = fg = gc; dashed = true; }
              else { bg = border = gc; fg = '#fff'; }
            }
            return (
              <View key={k} style={s.cell}>
                <T style={[s.acc, { color: r?.accent && r.accOk === false ? c.miss : c.ink }]}>{tk?.accent ? '>' : ''}</T>
                {tk ? (
                  <View style={[s.head, { backgroundColor: bg, borderColor: border, borderStyle: dashed ? 'dashed' : 'solid' },
                    isNow && { transform: [{ scale: 1.12 }] }]}>
                    <T style={[s.headTxt, { color: fg }]}>{tk.hand}</T>
                  </View>
                ) : (
                  <View style={s.rest}><View style={[s.dot, { backgroundColor: isNow ? c.accent : c.line }]} /></View>
                )}
                <T style={[s.cnt, { color: isNow ? c.accent : c.muted }, isNow && { fontFamily: F.monoBold }]}>
                  {countLabel(i, lesson.spb)}
                </T>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 7 },
  beat: { flex: 1, flexDirection: 'row', gap: 2, paddingTop: 2, borderTopWidth: 2, minWidth: 0 },
  cell: { flex: 1, alignItems: 'center', gap: 3, minWidth: 0 },
  acc: { height: 14, fontFamily: F.monoBold, fontSize: 13, lineHeight: 14 },
  head: { width: '100%', maxWidth: 32, aspectRatio: 1, borderRadius: 999, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  headTxt: { fontFamily: F.monoBold, fontSize: 12, lineHeight: 15 },
  rest: { width: '100%', maxWidth: 32, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  cnt: { fontSize: 11, lineHeight: 15, fontFamily: F.mono },
});
