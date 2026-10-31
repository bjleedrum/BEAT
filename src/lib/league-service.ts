/**
 * 리그 데이터: 서버(Supabase)가 연결돼 있으면 서버에서, 아니면 기기 안 기록으로.
 */
import { TIERS, weekKey } from './league';
import { PointEvent, Profile, weekPoints } from './store';
import { ensureSession, setLastError, supabase } from './supabase';

export type Member = { id: string; nickname: string; points: number };
export type LeagueView = {
  week: string;
  tier: string; // 't1' ~ 't6'
  nickname: string | null;
  me: string;
  members: Member[]; // 포인트 높은 순
  /** 지난주 결과: 1 승급, 0 유지, -1 강등 */
  last?: { week: string; result: number | null; points: number } | null;
  online: boolean;
};

export const serverReady = () => !!supabase;
export const tierId = (n: number) => TIERS[Math.min(TIERS.length, Math.max(1, n)) - 1].id;

export function localLeague(profile: Profile, points: PointEvent[]): LeagueView {
  const pts = weekPoints(points);
  return {
    week: weekKey(), tier: profile.tier, nickname: profile.nickname, me: 'me',
    members: pts > 0 ? [{ id: 'me', nickname: profile.nickname ?? '나', points: pts }] : [],
    online: false,
  };
}

export async function fetchLeague(): Promise<LeagueView | null> {
  if (!supabase || !(await ensureSession())) return null;
  const { data, error } = await supabase.rpc('beat_my_league');
  if (error || !data) { setLastError(`리그 불러오기 실패: ${error?.message ?? '빈 응답'}`); return null; }
  setLastError(null);
  const d = data as { week: string; tier: number; nickname: string | null; me: string; last: LeagueView['last']; members: Member[] };
  return { week: d.week, tier: tierId(d.tier), nickname: d.nickname, me: d.me, last: d.last, members: d.members ?? [], online: true };
}

/**
 * 아직 안 보낸 포인트 보내기. 서버는 '이번 주' 포인트로만 인정하므로
 * 지난주에 쌓였는데 못 보낸 기록은 보내지 않고 처리 완료로 표시한다.
 * @returns 처리 완료로 표시할 id 목록 (실패하면 null)
 */
export async function syncPoints(points: PointEvent[]): Promise<string[] | null> {
  const pending = points.filter(p => !p.synced);
  if (!pending.length) return [];
  const week = weekKey();
  const stale = pending.filter(p => p.week !== week).map(p => p.id);
  const now = pending.filter(p => p.week === week);
  if (!now.length) return stale;
  if (!supabase || !(await ensureSession())) return null;
  const { data, error } = await supabase.rpc('beat_add_points', {
    events: now.map(p => ({ id: p.id, pts: p.pts, lesson: p.lesson })),
  });
  if (error) { setLastError(`포인트 보내기 실패: ${error.message}`); return null; }
  return [...stale, ...((data as string[]) ?? [])];
}

export async function pushNickname(name: string): Promise<boolean> {
  if (!supabase || !(await ensureSession())) return false;
  const { error } = await supabase.rpc('beat_set_nickname', { name });
  return !error;
}
