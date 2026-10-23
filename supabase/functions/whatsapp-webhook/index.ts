/**
 * WhatsApp webhook for ThutoVest (Supabase Edge Function, Deno).
 *
 *   GET  → Meta's one-time webhook verification
 *   POST → incoming messages: verify signature, answer with the shared bot
 *
 * Modes (env BOT_MODE):
 *   demo (default): numbers in DEMO_ALLOWED_NUMBERS act as the demo student.
 *                   For the hackathon with Meta's free test number.
 *   live:           real students, read from the tables in
 *                   supabase/migrations/*_whatsapp.sql with the service role.
 *
 * Secrets (supabase secrets set ...), never in client code:
 *   WHATSAPP_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_VERIFY_TOKEN,
 *   WHATSAPP_PHONE_NUMBER_ID, APP_URL, DEMO_ALLOWED_NUMBERS,
 *   GRAPH_API_VERSION (optional; set it to the version shown in your Meta app dashboard)
 */
import { handleMessage, type BotContext, type BotSnapshot } from '../_shared/whatsapp/bot.ts';
import { createRateLimiter, parseWebhook, sendText, verifySignature, type InboundMessage } from '../_shared/whatsapp/meta.ts';
import { demoSnapshot } from '../_shared/whatsapp/demo.ts';

const env = (k: string) => Deno.env.get(k) ?? '';
const MODE = env('BOT_MODE') === 'live' ? 'live' : 'demo';
const APP_URL = env('APP_URL') || 'https://thutovest.vercel.app';
const send = { token: env('WHATSAPP_TOKEN'), phoneNumberId: env('WHATSAPP_PHONE_NUMBER_ID'), apiVersion: env('GRAPH_API_VERSION') || 'v23.0' };

const allowed = (n: string) => env('DEMO_ALLOWED_NUMBERS').split(',').map((s) => s.replace(/\D/g, '')).filter(Boolean).includes(n);
const limit = createRateLimiter(15, 10 * 60_000); // 15 messages per 10 minutes per number
const seen = new Set<string>(); // Meta retries webhooks; answer each message once
const demoOptedOut = new Set<string>();

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const ok = url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === env('WHATSAPP_VERIFY_TOKEN') && env('WHATSAPP_VERIFY_TOKEN') !== '';
    return ok ? new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 }) : new Response('Forbidden', { status: 403 });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const raw = await req.text();
  if (raw.length > 100_000) return new Response('Too large', { status: 413 });
  if (!(await verifySignature(raw, req.headers.get('x-hub-signature-256'), env('WHATSAPP_APP_SECRET')))) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  for (const msg of parseWebhook(payload)) {
    if (seen.has(msg.id)) continue;
    seen.add(msg.id);
    if (seen.size > 5000) seen.clear();
    try {
      await handle(msg);
    } catch (e) {
      // Never log message text or phone numbers.
      console.error('whatsapp handler failed', e instanceof Error ? e.message : 'unknown');
    }
  }
  // Always 200 for a valid, signed request so Meta doesn't retry.
  return new Response('ok', { status: 200 });
});

async function handle(msg: InboundMessage) {
  if (!limit(msg.from)) return;

  if (msg.type !== 'text' && msg.type !== 'interactive') {
    await sendText(send, msg.from, 'For your safety, we can’t accept photos, documents or voice notes on WhatsApp. Upload documents in the app only: ' + APP_URL);
    return;
  }

  const ctx = MODE === 'demo' ? demoContext(msg) : await liveContext(msg);
  if (!ctx) return; // demo mode: number not on the allowlist, stay silent
  const result = handleMessage(msg.text ?? '', ctx);

  if (MODE === 'demo') {
    if (result.effect?.type === 'optOut') demoOptedOut.add(msg.from);
    if (result.effect?.type === 'optIn') demoOptedOut.delete(msg.from);
  } else {
    await applyLiveEffect(msg, result.effect);
  }
  for (const reply of result.replies) await sendText(send, msg.from, reply);
}

function demoContext(msg: InboundMessage): BotContext | null {
  if (!allowed(msg.from)) return null;
  return { now: new Date(), linked: true, optedOut: demoOptedOut.has(msg.from), snapshot: demoSnapshot(), appUrl: APP_URL };
}

/* ---------------- Live mode: Supabase REST with the service role ---------------- */

const SB_URL = env('SUPABASE_URL');
const SB_KEY = env('SUPABASE_SERVICE_ROLE_KEY');

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  return (res.status === 204 ? [] : await res.json()) as T;
}

async function sha256(text: string) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('');
}

const phone = (digits: string) => `+${digits}`;

async function liveContext(msg: InboundMessage): Promise<BotContext> {
  const p = encodeURIComponent(phone(msg.from));
  const [link] = await rest<{ student_id: string; opted_out: boolean }[]>(`whatsapp_links?phone=eq.${p}&select=student_id,opted_out`);
  let snapshot: BotSnapshot | undefined;
  let pendingCode: BotContext['pendingCode'];

  if (link) {
    const [row] = await rest<{ snapshot: BotSnapshot }[]>(`bot_snapshots?student_id=eq.${link.student_id}&select=snapshot`);
    snapshot = row?.snapshot;
  } else {
    const code = /^link\s*(\d{6})$/i.exec((msg.text ?? '').trim())?.[1];
    if (code) {
      const [row] = await rest<{ student_id: string; expires_at: string }[]>(
        `whatsapp_link_codes?phone=eq.${p}&code_hash=eq.${await sha256(code)}&select=student_id,expires_at`,
      );
      if (row) {
        pendingCode = { code, expiresAt: row.expires_at };
        const [snap] = await rest<{ snapshot: BotSnapshot }[]>(`bot_snapshots?student_id=eq.${row.student_id}&select=snapshot`);
        snapshot = snap?.snapshot;
      }
    }
  }
  return { now: new Date(), linked: Boolean(link), optedOut: Boolean(link?.opted_out), snapshot, pendingCode, appUrl: APP_URL };
}

async function applyLiveEffect(msg: InboundMessage, effect: ReturnType<typeof handleMessage>['effect']) {
  if (!effect) return;
  const p = phone(msg.from);
  const q = encodeURIComponent(p);
  if (effect.type === 'link') {
    const [row] = await rest<{ student_id: string }[]>(`whatsapp_link_codes?phone=eq.${q}&select=student_id`);
    if (!row) return;
    await rest('whatsapp_links', { method: 'POST', body: JSON.stringify({ phone: p, student_id: row.student_id, linked_at: new Date().toISOString(), opted_out: false }) });
    await rest(`whatsapp_link_codes?phone=eq.${q}`, { method: 'DELETE' });
  } else if (effect.type === 'optOut' || effect.type === 'optIn') {
    await rest(`whatsapp_links?phone=eq.${q}`, { method: 'PATCH', body: JSON.stringify({ opted_out: effect.type === 'optOut' }) });
  } else if (effect.type === 'reportScam') {
    const [link] = await rest<{ student_id: string }[]>(`whatsapp_links?phone=eq.${q}&select=student_id`);
    await rest('scam_reports', { method: 'POST', body: JSON.stringify({ student_id: link?.student_id ?? null, channel: 'whatsapp', report: effect.text }) });
  }
}
