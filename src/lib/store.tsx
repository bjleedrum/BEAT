/**
 * 앱 상태: 진도, 설정, 연습한 날짜, 포인트 기록, 리그 프로필.
 * 폰의 문서 폴더에 beat-state.json 으로 저장해서 앱을 다시 켜도 유지된다.
 */
import { File, Paths } from 'expo-file-system';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

import { Earned, earnForPlay, earnForRead, TIERS, weekKey } from './league';
import { Lesson, PlayLesson, UNITS } from './lessons';

export type LessonProgress = { best?: number; bpm?: number; read?: boolean };
type ProgressMap = Record<string, LessonProgress>;

export type InputMode = 'mic' | 'tap';
export type Settings = { mode: InputMode; sens: number };

/** 포인트 한 건. synced: 서버에 보냈는지 */
export type PointEvent = { id: string; at: number; week: string; pts: number; lesson: string; synced?: boolean };

/** 리그 프로필 (서버 연결 전에는 기기 안에서만) */
export type Profile = { nickname: string | null; tier: string; seenResultWeek?: string };

type Saved = {
  v: 1;
  progress: ProgressMap;
  course: string | null;
  days: string[];
  settings: Settings;
  points: PointEvent[];
  profile: Profile;
};

const DEFAULTS: Saved = {
  v: 1, progress: {}, course: null, days: [], settings: { mode: 'mic', sens: 5 }, points: [],
  profile: { nickname: null, tier: TIERS[0].id },
};

const FILE = 'beat-state.json';
function load(): Saved {
  try {
    const f = new File(Paths.document, FILE);
    if (!f.exists) return DEFAULTS;
    const d = JSON.parse(f.textSync());
    return { ...DEFAULTS, ...d, settings: { ...DEFAULTS.settings, ...d.settings }, profile: { ...DEFAULTS.profile, ...d.profile } };
  } catch {
    return DEFAULTS;
  }
}
function save(d: Saved) {
  try {
    const f = new File(Paths.document, FILE);
    if (!f.exists) f.create();
    f.writeSync(JSON.stringify(d));
  } catch {}
}

type Store = Omit<Saved, 'v'> & {
  setSettings: (patch: Partial<Settings>) => void;
  setCourse: (unitId: string) => void;
  setProfile: (patch: Partial<Profile>) => void;
  /** 읽기·영상 완료. 받은 포인트를 돌려준다 */
  markRead: (lesson: Lesson) => Earned;
  /** 연주 결과 저장. 받은 포인트를 돌려준다 */
  saveScore: (lesson: PlayLesson, score: number, bpm: number) => Earned;
  markSynced: (ids: string[]) => void;
};

const Ctx = createContext<Store | null>(null);

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

let seq = 0;
const newId = () => `${Date.now().toString(36)}-${(seq++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Saved>(load);
  // 같은 순간 여러 번 호출돼도 최신 값을 보도록
  const cur = useRef(state);
  cur.current = state;
  const update = (fn: (s: Saved) => Saved) => setState(s => { const n = fn(s); cur.current = n; return n; });

  useEffect(() => { save(state); }, [state]);

  const today = () => dayKey(new Date());
  const addPoints = (s: Saved, e: Earned, lesson: string): Saved => {
    const days = s.days.includes(today()) ? s.days : [...s.days, today()].slice(-120);
    if (!e.total) return { ...s, days };
    const ev: PointEvent = { id: newId(), at: Date.now(), week: weekKey(), pts: e.total, lesson };
    return { ...s, days, points: [...s.points, ev].slice(-1000) };
  };

  const store: Store = {
    ...state,
    setSettings: patch => update(s => ({ ...s, settings: { ...s.settings, ...patch } })),
    setCourse: course => update(s => ({ ...s, course })),
    setProfile: patch => update(s => ({ ...s, profile: { ...s.profile, ...patch } })),
    markRead: lesson => {
      const s = cur.current;
      const e = earnForRead(!s.progress[lesson.id], !s.days.includes(today()), lesson.kind === 'video');
      update(x => addPoints({ ...x, progress: { ...x.progress, [lesson.id]: { ...x.progress[lesson.id], read: true } } }, e, lesson.id));
      return e;
    },
    saveScore: (lesson, score, bpm) => {
      const s = cur.current;
      const e = earnForPlay(lesson, score, bpm, !s.days.includes(today()));
      update(x => {
        const old = x.progress[lesson.id];
        const better = old?.best == null || score > old.best || (score === old.best && bpm > (old.bpm ?? 0));
        const progress = better ? { ...x.progress, [lesson.id]: { best: score, bpm } } : x.progress;
        return addPoints({ ...x, progress }, e, lesson.id);
      });
      return e;
    },
    markSynced: ids => update(s => ({ ...s, points: s.points.map(p => (ids.includes(p.id) ? { ...p, synced: true } : p)) })),
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider 밖에서 useStore를 썼어요');
  return s;
}

/** 이번 주 포인트 합 */
export const weekPoints = (points: PointEvent[], week = weekKey()) =>
  points.reduce((a, p) => a + (p.week === week ? p.pts : 0), 0);

/** 오늘(또는 어제)부터 거꾸로 이어진 연습 일수 */
export function streak(days: string[]) {
  const set = new Set(days), d = new Date();
  let n = 0;
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const isDone = (p: ProgressMap, id: string) => !!p[id];

/** 선택한 코스, 없으면 아직 안 끝낸 첫 코스 */
export function currentUnitIndex(course: string | null, p: ProgressMap) {
  const si = UNITS.findIndex(u => u.id === course);
  if (si >= 0) return si;
  const i = UNITS.findIndex(u => u.items.some(x => !p[x.id]));
  return i < 0 ? 0 : i;
}

export function nextLesson(course: string | null, p: ProgressMap): { lesson: Lesson; unitIndex: number } {
  const unitIndex = currentUnitIndex(course, p), u = UNITS[unitIndex];
  return { lesson: u.items.find(x => !p[x.id]) ?? u.items[0], unitIndex };
}
