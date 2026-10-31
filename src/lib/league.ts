/**
 * 리그 규칙 · 티어 · 포인트.
 * ▶ 티어 이름이나 색을 바꾸려면 TIERS만 고치면 된다. (id는 서버에 저장되므로 한번 정하면 바꾸지 말 것)
 * ▶ 승급/강등 인원은 LEAGUE에서. 서버(supabase/schema.sql)의 값도 같이 맞춰야 한다.
 */
import { PlayLesson } from './lessons';

export type Tier = { id: string; name: string; color: string };

export const TIERS: Tier[] = [
  { id: 't1', name: '스틱', color: '#B07A47' },
  { id: 't2', name: '패드', color: '#6E7787' },
  { id: 't3', name: '스네어', color: '#2E9E8F' },
  { id: 't4', name: '그루브', color: '#7B4BD6' },
  { id: 't5', name: '마스터', color: '#D9A21B' },
  { id: 't6', name: '레전드', color: '#D2443A' },
];

export const LEAGUE = {
  groupSize: 30, // 한 리그 최대 인원
  promote: 7, // 상위 N명 승급
  demote: 5, // 하위 N명 강등
};

export const tierIndex = (id: string) => Math.max(0, TIERS.findIndex(t => t.id === id));
export const tierOf = (id: string) => TIERS[tierIndex(id)];

/* ---------- 주 (한국 시간 월요일 0시 ~ 다음 월요일 0시) ---------- */
const KST = 9 * 3600 * 1000, DAY = 86400 * 1000;

/** 이번 주 월요일 0시(KST)의 실제 시각(ms) */
export function weekStartMs(now = Date.now()) {
  const k = new Date(now + KST); // KST 시각을 UTC 필드로 읽기 위함
  const dow = (k.getUTCDay() + 6) % 7; // 월=0
  const mid = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()) - dow * DAY;
  return mid - KST;
}
/** 주 이름: 그 주 월요일 날짜 'YYYY-MM-DD' (KST) */
export function weekKey(now = Date.now()) {
  return new Date(weekStartMs(now) + KST).toISOString().slice(0, 10);
}
export const weekEndMs = (now = Date.now()) => weekStartMs(now) + 7 * DAY;

/** "2일 5시간 남음" */
export function timeLeft(now = Date.now()) {
  const ms = weekEndMs(now) - now, d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return d > 0 ? `${d}일 ${h}시간 남음` : h > 0 ? `${h}시간 ${m}분 남음` : `${m}분 남음`;
}

/* ---------- 포인트 ---------- */
export type PointPart = { label: string; pts: number };
export type Earned = { total: number; parts: PointPart[] };

export const POINTS = {
  readFirst: 10, // 읽기 카드 · 영상 첫 완료
  bpmBonus: 5, // 기본 BPM보다 빠르게 80점 이상
  firstOfDay: 5, // 그날 첫 연습
};
/** 연주 점수 → 포인트 */
export const playPoints = (score: number) => (score >= 90 ? 20 : score >= 75 ? 15 : score >= 50 ? 10 : score >= 20 ? 5 : 0);

export function earnForPlay(lesson: PlayLesson, score: number, bpm: number, firstToday: boolean): Earned {
  const parts: PointPart[] = [];
  const base = playPoints(score);
  if (base) parts.push({ label: '연주', pts: base });
  if (score >= 80 && bpm > lesson.bpm) parts.push({ label: 'BPM 도전', pts: POINTS.bpmBonus });
  if (firstToday && base) parts.push({ label: '오늘 첫 연습', pts: POINTS.firstOfDay });
  return { total: parts.reduce((a, p) => a + p.pts, 0), parts };
}

export function earnForRead(firstTime: boolean, firstToday: boolean, video: boolean): Earned {
  const parts: PointPart[] = [];
  if (firstTime) parts.push({ label: video ? '영상 완료' : '카드 완료', pts: POINTS.readFirst });
  if (firstToday && firstTime) parts.push({ label: '오늘 첫 연습', pts: POINTS.firstOfDay });
  return { total: parts.reduce((a, p) => a + p.pts, 0), parts };
}
