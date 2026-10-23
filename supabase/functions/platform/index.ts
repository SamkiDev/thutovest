/**
 * Marketplace API for ThutoVest (Supabase Edge Function, Deno).
 *
 *   POST { op: 'load' }            → the caller's filtered view of the marketplace
 *   POST { op: 'act', action }     → run one action, return the new filtered view
 *
 * Who the caller is comes only from their Supabase login token, looked up in
 * `profiles`. Every action passes the same authorize() and platformReducer()
 * the app uses (bundled from src/ by `npm run build:server`), so field
 * whitelists, ownership checks and message moderation are enforced here.
 *
 * Env (set automatically by Supabase for Edge Functions):
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * Optional: ALLOWED_ORIGINS (comma separated; default allows any origin, no cookies are used)
 */
import { authorize, createPlatformSeed, isPlatformState, platformReducer, projectFor } from '../_shared/platform-core.js';

// Minimal local shapes; the full types live in src/types and are enforced by the bundled code.
type Session = { role: 'student' | 'sponsor'; userId: string; email: string; demo: boolean };
type PlatformState = { events: { id: string }[] } & Record<string, unknown>;
type PlatformAction = { type: string } & Record<string, unknown>;

const env = (k: string) => Deno.env.get(k) ?? '';
const SB_URL = env('SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = env('SUPABASE_ANON_KEY');
const ALLOWED = env('ALLOWED_ORIGINS').split(',').map((s) => s.trim()).filter(Boolean);

const MAX_BODY = 3_000_000; // document snapshots carry small image previews
const hits = new Map<string, number[]>();
/** 40 actions per minute per account, per function instance. */
function allow(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= 40) return false;
  recent.push(now);
  hits.set(key, recent);
  return true;
}

function cors(origin: string | null): Record<string, string> {
  const allowOrigin = ALLOWED.length === 0 ? '*' : origin && ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`db ${res.status}`);
  return (res.status === 204 ? null : await res.json()) as T;
}

/** The caller's app identity, or null when signed out or the token is not valid. */
async function sessionFrom(req: Request): Promise<Session | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!token || token === ANON_KEY || token.startsWith('sb_publishable_')) return null;
  const res = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY || SERVICE_KEY, Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string; email?: string };
  if (!user.id) return null;
  const [profile] = await rest<{ role: 'student' | 'sponsor'; app_user_id: string }[]>(
    `profiles?user_id=eq.${encodeURIComponent(user.id)}&select=role,app_user_id`,
  );
  if (!profile) return null;
  return { role: profile.role, userId: profile.app_user_id, email: user.email ?? '', demo: true };
}

async function readState(): Promise<{ state: PlatformState; version: number }> {
  const [row] = await rest<{ state: unknown; version: number }[]>('platform_state?id=eq.1&select=state,version');
  if (row && isPlatformState(row.state)) return { state: row.state, version: row.version };
  // First run, or a stored state from an older version: start from the demo seed.
  const seed = createPlatformSeed();
  const version = await commit(row ? row.version : 0, seed);
  if (version == null) return readState();
  return { state: seed, version };
}

async function commit(expected: number, state: PlatformState): Promise<number | null> {
  return await rest<number | null>('rpc/commit_platform_state', { method: 'POST', body: JSON.stringify({ p_expected: expected, p_state: state }) });
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405, headers);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: 'too-large' }, 413, headers);
  let body: { op?: unknown; action?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'bad-request' }, 400, headers);
  }

  try {
    const session = await sessionFrom(req);

    if (body.op === 'load') {
      const { state, version } = await readState();
      return json({ state: projectFor(state, session), version, session }, 200, headers);
    }

    if (body.op === 'act') {
      if (!session) return json({ error: 'sign-in-required' }, 401, headers);
      if (!allow(session.userId)) return json({ error: 'rate-limited' }, 429, headers);
      const action = body.action as PlatformAction;
      // State replacement is a browser-only sync step; the server never accepts it.
      if (!action || typeof action !== 'object' || typeof action.type !== 'string' || action.type === 'hydrate') {
        return json({ error: 'bad-action' }, 400, headers);
      }

      for (let attempt = 0; attempt < 4; attempt++) {
        const { state, version } = await readState();
        const allowed = authorize(state, action, session);
        if (!allowed) return json({ error: 'not-permitted', state: projectFor(state, session), version }, 403, headers);
        const next = platformReducer(state, allowed);
        const seen = new Set(state.events.map((e) => e.id));
        const ownEventIds = next.events.filter((e) => !seen.has(e.id)).map((e) => e.id);
        const committed = next === state ? version : await commit(version, next);
        if (committed != null) return json({ state: projectFor(next, session), version: committed, ownEventIds }, 200, headers);
        // Someone else wrote first: re-read and re-run the action on the newer state.
      }
      return json({ error: 'busy' }, 409, headers);
    }

    return json({ error: 'bad-request' }, 400, headers);
  } catch (e) {
    // No request bodies or personal data in logs.
    console.error('platform failed', e instanceof Error ? e.message : 'unknown');
    return json({ error: 'server-error' }, 500, headers);
  }
});
