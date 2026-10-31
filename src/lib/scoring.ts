/**
 * BEAT 채점 로직
 * 웹 버전의 evaluate() / tips()를 옮긴 것. 오디오와 화면에 의존하지 않는 순수 함수라서
 * 나중에 네이티브 오디오 엔진이 타격 시각만 넘겨주면 그대로 쓸 수 있다.
 * 시간 단위는 모두 초(s), 결과의 off/mean/sd만 ms.
 */
import { PlayLesson } from './lessons';

export type InputMode = 'mic' | 'tap';
export type Grade = 'perfect' | 'good' | 'early' | 'late' | 'miss';

/** 오디오 엔진이 감지한 타격. peak는 세기(마이크 모드), 탭 모드는 null */
export type Hit = { t: number; peak: number | null };

/** 연주해야 할 음 하나 */
export type Note = { t: number; bar: number; i: number; accent: boolean };

/** 한 번의 연주 일정 (오디오 엔진이 만들어 넘겨줌) */
export type RunInfo = { t0: number; end: number; step: number; notes: Note[] };

export type NoteResult = Note & { off: number | null; grade: Grade; peak: number | null; accOk?: boolean };

export type Result = {
  score: number;
  res: NoteResult[];
  extras: number;
  mean: number;
  sd: number;
  acc: { ok: number; total: number } | null;
  counts: { perfect: number; good: number; off: number; miss: number };
  calibrated: boolean;
  mode: InputMode;
  shift: number;
};

/** 보정 전 기본 지연값 (초) */
export const DEFAULT_LATENCY: Record<InputMode, number> = { mic: 0.1, tap: 0.03 };

/** 한 박(beat)을 칸(step)으로 나눈 연주 일정을 만든다 */
export function buildNotes(lesson: PlayLesson, bpm: number, t0: number, bars: number): RunInfo {
  const beat = 60 / bpm, step = beat / lesson.spb, n = lesson.tokens.length;
  const notes: Note[] = [];
  for (let b = 0; b < bars; b++)
    lesson.tokens.forEach((tk, i) => { if (tk) notes.push({ t: t0 + (b * n + i) * step, bar: b, i, accent: tk.accent }); });
  return { t0, end: t0 + bars * n * step, step, notes };
}

/**
 * @param baseLatency 기기 지연(초). 보정값이 있으면 그 값, 없으면 DEFAULT_LATENCY(+출력 지연)
 * @param calibrated  사용자가 지연 보정을 했는지
 */
export function evaluate(r: RunInfo, hitsRaw: Hit[], lesson: PlayLesson, mode: InputMode,
  baseLatency: number, calibrated: boolean): Result {
  const win = Math.min(0.18, r.step * 0.5);
  const L0 = baseLatency;

  // 자동 맞춤: 가장 많은 타격이 맞아떨어지는 일정한 밀림(±350ms)을 찾고, 같으면 작은 쪽 우선
  const countAt = (s: number) => {
    let c = 0;
    r.notes.forEach(nt => { if (hitsRaw.some(h => Math.abs(h.t - L0 - s - nt.t) <= win * 0.6)) c++; });
    return c;
  };
  let shift = 0, best = countAt(0);
  for (let k = 1; k <= 70; k++) for (const s of [k * 0.005, -k * 0.005]) {
    const c = countAt(s);
    if (c > best) { best = c; shift = s; }
  }
  if (best) {
    const ds: number[] = [];
    r.notes.forEach(nt => {
      let m: number | null = null;
      hitsRaw.forEach(h => { const d = h.t - L0 - shift - nt.t; if (Math.abs(d) <= win && (m === null || Math.abs(d) < Math.abs(m))) m = d; });
      if (m !== null) ds.push(m);
    });
    if (ds.length) { ds.sort((a, b) => a - b); shift += ds[Math.floor(ds.length / 2)]; }
  }
  const L = L0 + shift;

  // 음과 타격을 가까운 것부터 1:1로 짝짓기
  const hits = hitsRaw.map(h => ({ t: h.t - L, peak: h.peak, used: false }))
    .filter(h => h.t > r.t0 - win && h.t < r.end + win);
  const pairs: { ni: number; hi: number; d: number }[] = [];
  r.notes.forEach((nt, ni) => hits.forEach((h, hi) => { const d = h.t - nt.t; if (Math.abs(d) <= win) pairs.push({ ni, hi, d }); }));
  pairs.sort((a, b) => Math.abs(a.d) - Math.abs(b.d));
  const res: NoteResult[] = r.notes.map(nt => ({ ...nt, off: null, grade: 'miss', peak: null }));
  pairs.forEach(p => {
    if (res[p.ni].off !== null || hits[p.hi].used) return;
    hits[p.hi].used = true; res[p.ni].off = p.d * 1000; res[p.ni].peak = hits[p.hi].peak;
  });
  res.forEach(x => {
    if (x.off === null) return;
    const a = Math.abs(x.off);
    x.grade = a <= 40 ? 'perfect' : a <= 80 ? 'good' : x.off < 0 ? 'early' : 'late';
  });

  const extras = hits.filter(h => !h.used).length;
  const pts: Record<Grade, number> = { perfect: 100, good: 85, early: 60, late: 60, miss: 0 };
  let score = res.reduce((s, x) => s + pts[x.grade], 0) / res.length - extras * 2;

  const matched = res.filter(x => x.off !== null), offs = matched.map(x => x.off as number);
  const mean = offs.length ? offs.reduce((a, b) => a + b, 0) / offs.length : 0;
  const sd = offs.length > 1 ? Math.sqrt(offs.reduce((a, b) => a + (b - mean) ** 2, 0) / (offs.length - 1)) : 0;

  // 악센트: 약한 음 세기의 중앙값보다 15% 이상 크면 성공 (마이크 모드만)
  let acc: Result['acc'] = null;
  if (lesson.hasAccent && mode === 'mic') {
    const soft = matched.filter(x => !x.accent).map(x => x.peak as number).sort((a, b) => a - b);
    const med = soft.length ? soft[Math.floor(soft.length / 2)] : null;
    const accN = res.filter(x => x.accent);
    if (med) {
      let ok = 0;
      accN.forEach(x => { x.accOk = x.peak != null && x.peak >= med * 1.15; if (x.accOk) ok++; });
      acc = { ok, total: accN.length };
      score = score * 0.85 + 15 * (ok / accN.length);
    }
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const cnt = (g: Grade) => res.filter(x => x.grade === g).length;
  return {
    score, res, extras, mean, sd, acc,
    counts: { perfect: cnt('perfect'), good: cnt('good'), off: cnt('early') + cnt('late'), miss: cnt('miss') },
    calibrated, mode, shift,
  };
}

export type TipTone = 'perfect' | 'off' | 'miss' | 'muted' | 'accent';
export type Tip = { text: string; tone: TipTone };

/** 결과 화면의 코칭 문구 */
export function tips(R: Result, lesson: PlayLesson): Tip[] {
  const t: Tip[] = [], m = Math.round(Math.abs(R.mean));
  const add = (text: string, tone: TipTone) => t.push({ text, tone });
  if (R.counts.miss > R.res.length * 0.6) {
    add('소리가 거의 안 잡혔어요. 설정에서 감도를 올리거나 휴대폰을 패드 가까이 두세요.', 'miss');
    return t;
  }
  if (R.mean < -25) add(`전체적으로 ${m}ms 정도 서두르고 있어요. 클릭 소리를 끝까지 듣고 치는 느낌으로 가보세요.`, 'off');
  else if (R.mean > 25) add(`전체적으로 ${m}ms 정도 늦게 들어가요. 스틱을 미리 들어 올려 준비해 두세요.`, 'off');
  if (R.sd > 45) add(`음마다 타이밍 편차가 커요(±${Math.round(R.sd)}ms). BPM을 5 낮춰서 고르게 치는 데 집중해 보세요.`, 'off');
  if (R.counts.miss) add(`${R.counts.miss}개를 놓쳤어요. ${lesson.id === 'offbeat' ? '엇박은 정박을 머릿속으로 세면서 &에서만 쳐야 해요.' : '점선으로 표시된 음을 확인해 보세요.'}`, 'miss');
  if (R.extras) add(`박자 밖에서 ${R.extras}번 소리가 잡혔어요. 주변 소음 때문이면 설정에서 감도를 낮춰 보세요.`, 'muted');
  if (Math.abs(R.shift) > 0.04) add(`기기 지연 때문에 전체가 ${Math.round(Math.abs(R.shift) * 1000)}ms 밀려 있어서 자동으로 맞춰 채점했어요. 설정에서 지연 보정을 해두면 더 정확해요.`, 'muted');
  if (R.acc && R.acc.ok < R.acc.total) add(`악센트 ${R.acc.total}개 중 ${R.acc.ok}개가 살아 있어요. 악센트는 높이서, 나머지는 패드 가까이에서 치세요.`, 'off');
  if (lesson.hasAccent && R.mode === 'tap') add('화면 탭 모드에서는 세기(악센트)를 평가하지 않아요.', 'muted');
  if (!R.calibrated) add('아직 지연 보정을 안 해서 전체가 조금 밀려 보일 수 있어요. 설정에서 한 번 보정해 두세요.', 'muted');
  if (R.score >= 90) t.unshift({ text: '아주 안정적이에요. BPM을 올려서 도전해 보세요.', tone: 'perfect' });
  if (!t.length) add('좋아요. 한 번 더 쳐서 감을 굳혀 보세요.', 'accent');
  return t;
}

/** 점수 → 별 개수 (0~3) */
export const starsFor = (s: number) => (s >= 90 ? 3 : s >= 75 ? 2 : s >= 50 ? 1 : 0);
