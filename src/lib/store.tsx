/**
 * 학습 진도 상태 (완료한 레슨, 최고 점수, 선택한 코스, 연습한 날짜)
 * TODO: 기기에 저장하기 (지금은 앱을 다시 켜면 초기화됨)
 */
import { createContext, ReactNode, useContext, useState } from 'react';
import { Lesson, UNITS } from './lessons';

export type LessonProgress = { best?: number; bpm?: number; read?: boolean };
type ProgressMap = Record<string, LessonProgress>;

type Store = {
  progress: ProgressMap;
  course: string | null;
  days: string[];
  markRead: (id: string) => void;
  saveScore: (id: string, score: number, bpm: number) => void;
  setCourse: (unitId: string) => void;
};

const Ctx = createContext<Store | null>(null);

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [course, setCourse] = useState<string | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const markDay = () => {
    const k = dayKey(new Date());
    setDays(d => (d.includes(k) ? d : [...d, k].slice(-120)));
  };
  const store: Store = {
    progress, course, days, setCourse,
    markRead: id => { setProgress(p => ({ ...p, [id]: { ...p[id], read: true } })); markDay(); },
    saveScore: (id, score, bpm) => {
      setProgress(p => {
        const old = p[id];
        if (old?.best != null && (score < old.best || (score === old.best && bpm <= (old.bpm ?? 0)))) return p;
        return { ...p, [id]: { best: score, bpm } };
      });
      markDay();
    },
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider 밖에서 useStore를 썼어요');
  return s;
}

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
