/**
 * Twilio WhatsApp plumbing (sandbox or a Twilio WhatsApp sender): verify
 * Twilio's signature, read the incoming form, answer with TwiML. Replies go
 * back in the HTTP response, so no API credentials are needed to send.
 * Uses only Web APIs, so it runs in Deno and in Node 20+ for tests.
 */

/**
 * Twilio signs each request: base64(HMAC-SHA1(authToken, url + each POST
 * param name and value, sorted by name)). Compared in constant time.
 */
export async function verifyTwilioSignature(url: string, params: URLSearchParams, header: string | null, authToken: string): Promise<boolean> {
  if (!header || !authToken) return false;
  const payload = url + [...params.keys()].sort().map((k) => k + (params.get(k) ?? '')).join('');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
  const expected = btoa(String.fromCharCode(...mac));
  if (expected.length !== header.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  return diff === 0;
}

export interface TwilioInbound {
  id: string;
  /** Sender in E.164 without the plus, e.g. 27821234567. */
  from: string;
  text: string;
  hasMedia: boolean;
}

/** Reads the form Twilio posts for an incoming WhatsApp message. Null when it isn't one. */
export function parseTwilioForm(params: URLSearchParams): TwilioInbound | null {
  const id = params.get('MessageSid') ?? params.get('SmsMessageSid') ?? '';
  const from = (params.get('WaId') ?? params.get('From') ?? '').replace(/\D/g, '');
  if (!id || !/^\d{8,15}$/.test(from)) return null;
  return { id, from, text: params.get('Body') ?? '', hasMedia: Number(params.get('NumMedia') ?? '0') > 0 };
}

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

/** TwiML that sends each reply as its own WhatsApp message (or nothing). */
export function twiml(replies: string[]): string {
  const body = replies.map((r) => `<Message>${escapeXml(r.slice(0, 1500))}</Message>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}
