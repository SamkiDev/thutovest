import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { PlatformAction } from './platformReducer';
import type { PlatformState, Role, Session } from '../types';

/**
 * Connection to the Supabase backend. It is switched on only when both public
 * values are set (see .env.example); otherwise the app runs fully in the
 * browser as before. Only the public URL and anon/publishable key ever reach
 * the browser.
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const backendEnabled = Boolean(URL && KEY);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!backendEnabled) throw new Error('Backend is not configured');
  // One login per tab (sessionStorage), so a student and a sponsor can sit side by side in one browser.
  client ??= createClient(URL!, KEY!, { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true } });
  return client;
}

export interface PlatformReply {
  state: PlatformState;
  version: number;
  ownEventIds?: string[];
  error?: string;
}

/** Thrown when this tab's login has ended and could not be refreshed. */
export class SessionExpiredError extends Error {
  constructor() {
    super('session-expired');
  }
}

const isUnauthorized = (error: unknown) => (error as { context?: Response }).context?.status === 401;

async function call(body: object): Promise<PlatformReply> {
  let { data, error } = await supabase().functions.invoke<PlatformReply>('platform', { body });
  if (error && isUnauthorized(error)) {
    // The access token may have lapsed while the tab slept: refresh once and retry.
    const { data: refreshed } = await supabase().auth.refreshSession();
    if (!refreshed.session) throw new SessionExpiredError();
    ({ data, error } = await supabase().functions.invoke<PlatformReply>('platform', { body }));
    if (error && isUnauthorized(error)) throw new SessionExpiredError();
  }
  if (error) {
    // 403 replies still carry the current state so the app can correct itself.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      const reply = (await ctx.json().catch(() => null)) as PlatformReply | null;
      if (reply?.state) return reply;
    }
    throw error;
  }
  return data!;
}

export const loadPlatform = () => call({ op: 'load' });
export const actOnPlatform = (action: PlatformAction) => call({ op: 'act', action });

export type SignInResult = { ok: true; session: Session } | { ok: false; reason: 'wrong-password' | 'no-profile' | 'unavailable' };

/** Real sign-in. The role and app id come from the server-side profile, not the form. */
export async function signInWithBackend(email: string, password: string): Promise<SignInResult> {
  try {
    const { data, error } = await supabase().auth.signInWithPassword({ email, password });
    if (error) return { ok: false, reason: error.status === 400 ? 'wrong-password' : 'unavailable' };
    const { data: profile, error: pErr } = await supabase().from('profiles').select('role, app_user_id').eq('user_id', data.user.id).maybeSingle();
    if (pErr) return { ok: false, reason: 'unavailable' };
    if (!profile) return { ok: false, reason: 'no-profile' };
    return { ok: true, session: { role: profile.role as Role, userId: profile.app_user_id as string, email: data.user.email ?? email, demo: true, backend: true } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/**
 * Signs out this tab only. The default ("global") would end every session of the
 * account, logging out everyone else using the shared demo login.
 */
export async function signOutOfBackend() {
  if (backendEnabled) await supabase().auth.signOut({ scope: 'local' }).catch(() => undefined);
}

/**
 * Calls onLost if this tab's login ends without the user signing out: the refresh
 * token was revoked or expired, or the stored session could not be recovered.
 */
export function watchBackendSession(onLost: () => void): () => void {
  const client = supabase();
  let active = true;
  client.auth.getSession().then(({ data }) => {
    if (active && !data.session) onLost();
  });
  const { data } = client.auth.onAuthStateChange((event, session) => {
    if (!active || (event !== 'SIGNED_OUT' && session)) return;
    // Supabase also relays a sign-out from any other tab of this browser, though each tab
    // keeps its own login: check this tab's own session before treating it as lost.
    // (Deferred: calling the client inside this callback can deadlock.)
    window.setTimeout(() => {
      client.auth.getSession().then(({ data: d }) => {
        if (active && !d.session) onLost();
      });
    }, 0);
  });
  // Browsers pause timers in background tabs; check (and refresh) the login when the tab comes back.
  const onVisible = () => {
    if (document.visibilityState !== 'visible') return;
    client.auth.getSession().then(({ data: d }) => {
      if (active && !d.session) onLost();
    });
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    active = false;
    data.subscription.unsubscribe();
    document.removeEventListener('visibilitychange', onVisible);
  };
}

/** Calls onTick whenever the shared marketplace changes. The notification carries only a version number. */
export function subscribeToTicks(onTick: (version: number) => void): () => void {
  const channel = supabase()
    .channel('platform-ticks')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'platform_ticks' }, (p) => onTick(Number((p.new as { version: number }).version)))
    .subscribe();
  return () => {
    supabase().removeChannel(channel);
  };
}

/* ---------- The student's own plan (RLS: owner only) ---------- */

export async function loadStudentState<T>(): Promise<T | null> {
  const { data: user } = await supabase().auth.getUser();
  if (!user.user) return null;
  const { data, error } = await supabase().from('student_states').select('state').eq('user_id', user.user.id).maybeSingle();
  if (error) throw error;
  return (data?.state as T) ?? null;
}

export async function saveStudentState(state: unknown) {
  const { data: user } = await supabase().auth.getUser();
  if (!user.user) return;
  const { error } = await supabase().from('student_states').upsert({ user_id: user.user.id, state });
  if (error) throw error;
}

export function subscribeToStudentState<T>(onChange: (state: T) => void): () => void {
  let channel: ReturnType<SupabaseClient['channel']> | null = null;
  let closed = false;
  supabase()
    .auth.getUser()
    .then(({ data }) => {
      if (closed || !data.user) return;
      channel = supabase()
        .channel(`student-${data.user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_states', filter: `user_id=eq.${data.user.id}` }, (p) => {
          const next = (p.new as { state?: T } | null)?.state;
          if (next) onChange(next);
        })
        .subscribe();
    });
  return () => {
    closed = true;
    if (channel) supabase().removeChannel(channel);
  };
}
