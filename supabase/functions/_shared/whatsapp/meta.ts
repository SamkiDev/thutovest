/**
 * WhatsApp Cloud API plumbing: verify Meta's signature, read incoming
 * messages, send replies. Uses only Web APIs (fetch, crypto.subtle), so it
 * runs in Deno (Supabase Edge Functions) and in Node 20+ for tests.
 */

/** Constant-time check of the X-Hub-Signature-256 header against the raw body. */
export async function verifySignature(rawBody: string, header: string | null, appSecret: string): Promise<boolean> {
  if (!header?.startsWith('sha256=') || !appSecret) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)));
  const expected = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
  const given = header.slice('sha256='.length).toLowerCase();
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

export interface InboundMessage {
  id: string;
  /** Sender in E.164 without the plus, as Meta sends it, e.g. 27821234567. */
  from: string;
  type: string;
  text?: string;
  timestamp: number;
}

/** Pulls messages out of a webhook payload. Ignores statuses and anything malformed. */
export function parseWebhook(payload: unknown): InboundMessage[] {
  const out: InboundMessage[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return out;
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const messages = (change as { value?: { messages?: unknown[] } })?.value?.messages;
      if (!Array.isArray(messages)) continue;
      for (const m of messages) {
        const msg = m as { id?: unknown; from?: unknown; type?: unknown; timestamp?: unknown; text?: { body?: unknown }; interactive?: { button_reply?: { id?: unknown } } };
        if (typeof msg.id !== 'string' || typeof msg.from !== 'string' || !/^\d{8,15}$/.test(msg.from)) continue;
        const text = typeof msg.text?.body === 'string' ? msg.text.body : typeof msg.interactive?.button_reply?.id === 'string' ? msg.interactive.button_reply.id : undefined;
        out.push({ id: msg.id, from: msg.from, type: typeof msg.type === 'string' ? msg.type : 'unknown', text, timestamp: Number(msg.timestamp) || 0 });
      }
    }
  }
  return out;
}

export interface SendConfig {
  token: string;
  phoneNumberId: string;
  apiVersion: string;
}

/** Sends one plain-text reply. Only call within the 24-hour customer service window. */
export async function sendText(cfg: SendConfig, toDigits: string, body: string): Promise<boolean> {
  const res = await fetch(`https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: toDigits, type: 'text', text: { preview_url: false, body: body.slice(0, 4000) } }),
  });
  if (!res.ok) {
    // Status and Meta's error code only (190 = expired token, 131030 = recipient not on the test list). Never the text or number.
    const code = await res.json().then((j: { error?: { code?: unknown } }) => j?.error?.code, () => undefined);
    console.error(`whatsapp send failed: http ${res.status}, meta code ${typeof code === 'number' ? code : 'unknown'}`);
  }
  return res.ok;
}

/** Simple sliding-window limiter, per sender, per function instance. */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string, now = Date.now()): boolean => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}
