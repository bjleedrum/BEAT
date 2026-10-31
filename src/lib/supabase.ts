/** Supabase 연결. 로그인 세션은 폰의 문서 폴더에 저장한다 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { File, Paths } from 'expo-file-system';

import { SUPABASE_KEY, SUPABASE_URL } from './config';

const fileFor = (key: string) => new File(Paths.document, `sb-${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
const storage = {
  getItem: (key: string) => { try { const f = fileFor(key); return f.exists ? f.textSync() : null; } catch { return null; } },
  setItem: (key: string, value: string) => { try { const f = fileFor(key); if (!f.exists) f.create(); f.writeSync(value); } catch {} },
  removeItem: (key: string) => { try { const f = fileFor(key); if (f.exists) f.delete(); } catch {} },
};

export const supabase: SupabaseClient | null = SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

/** 마지막 서버 오류 (리그 화면에 표시) */
export let lastError: string | null = null;
export const setLastError = (e: string | null) => { lastError = e; };

/** 로그인 세션 확보 (없으면 익명 로그인). 실패하면 false */
export async function ensureSession(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    const { error } = await supabase.auth.signInAnonymously();
    if (error) { lastError = `로그인 실패: ${error.message}`; return false; }
    return true;
  } catch (e) {
    lastError = `연결 실패: ${e instanceof Error ? e.message : String(e)}`;
    return false;
  }
}
