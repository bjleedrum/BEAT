/**
 * 리그 상태를 앱 전체에서 공유하고 서버와 맞춘다.
 * - 새 포인트가 생기면 서버로 보냄
 * - 앱이 앞으로 나올 때, 리그 탭을 볼 때 새로고침
 * - 서버의 티어 · 닉네임을 기기 프로필에 반영
 */
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { fetchLeague, LeagueView, localLeague, pushNickname, serverReady, syncPoints } from './league-service';
import { useStore } from './store';
import { lastError } from './supabase';

type Ctx = { view: LeagueView; error: string | null; loading: boolean; refresh: () => Promise<void>; saveNickname: (n: string) => Promise<void> };
const LeagueCtx = createContext<Ctx | null>(null);

export function LeagueProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const { points, profile, setProfile, markSynced } = store;
  const [server, setServer] = useState<LeagueView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const latest = useRef(store);
  latest.current = store;

  const refresh = useCallback(async () => {
    if (!serverReady() || busy.current) return;
    busy.current = true; setLoading(true);
    try {
      const done = await syncPoints(latest.current.points);
      if (done?.length) latest.current.markSynced(done);
      let v = await fetchLeague();
      if (v) {
        const p = latest.current.profile;
        if (!v.nickname && p.nickname && (await pushNickname(p.nickname))) v = (await fetchLeague()) ?? v;
        if (v.nickname && v.nickname !== p.nickname) latest.current.setProfile({ nickname: v.nickname });
        if (v.tier !== p.tier) latest.current.setProfile({ tier: v.tier });
        setServer(v);
      }
    } catch (e) {
      setError(`오류: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (lastError) setError(lastError); else if (busy.current) setError(null);
      busy.current = false; setLoading(false);
    }
  }, []);

  // 처음 켤 때 + 앱이 다시 앞으로 나올 때
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);

  // 안 보낸 포인트가 생기면 잠깐 뒤 보내기
  const pending = points.filter(p => !p.synced).length;
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(refresh, 800);
    return () => clearTimeout(t);
  }, [pending, refresh]);

  const saveNickname = async (n: string) => {
    setProfile({ nickname: n });
    if (serverReady() && (await pushNickname(n))) await refresh();
  };

  // 화면에 보일 리그: 서버 값 + 아직 못 보낸 내 포인트
  let view = localLeague(profile, points);
  if (server) {
    const extra = points.filter(p => !p.synced && p.week === server.week).reduce((a, p) => a + p.pts, 0);
    let members = server.members.map(m => (m.id === server.me ? { ...m, points: m.points + extra, nickname: profile.nickname ?? m.nickname } : m));
    if (extra && !members.some(m => m.id === server.me)) members = [...members, { id: server.me, nickname: profile.nickname ?? '나', points: extra }];
    view = { ...server, members: members.sort((a, b) => b.points - a.points) };
  }
  return <LeagueCtx.Provider value={{ view, error, loading, refresh, saveNickname }}>{children}</LeagueCtx.Provider>;
}

export function useLeague() {
  const c = useContext(LeagueCtx);
  if (!c) throw new Error('LeagueProvider 밖에서 useLeague를 썼어요');
  return c;
}
