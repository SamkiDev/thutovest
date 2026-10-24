// Runs the real whatsapp-webhook/index.ts under Node with a stubbed Deno and a mocked Graph API.
// Usage: npm test (or node --experimental-strip-types tests/whatsapp-meta.test.mjs)
import { pathToFileURL } from 'node:url';
import { createHmac } from 'node:crypto';

const SECRET = 'test-app-secret';
const env = {
  BOT_MODE: 'demo',
  WHATSAPP_TOKEN: 'test-token',
  WHATSAPP_APP_SECRET: SECRET,
  WHATSAPP_VERIFY_TOKEN: 'verify-me',
  WHATSAPP_PHONE_NUMBER_ID: '1234567890',
  GRAPH_API_VERSION: 'v23.0',
  DEMO_ALLOWED_NUMBERS: '27821234567, +27 73 123 4567',
  APP_URL: 'https://example.test',
};
let handler;
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };

const sent = [];
const realFetch = globalThis.fetch;
let graphStatus = 200;
globalThis.fetch = async (url, init) => {
  if (String(url).startsWith('https://graph.facebook.com/')) {
    sent.push({ url: String(url), body: JSON.parse(init.body) });
    return new Response(graphStatus === 200 ? '{}' : JSON.stringify({ error: { code: 190, message: 'expired' } }), { status: graphStatus });
  }
  return realFetch(url, init);
};

await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : new URL('../supabase/functions/whatsapp-webhook/index.ts', import.meta.url).href);

const sign = (raw, secret = SECRET) => 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
let n = 0;
const msg = (from, text, type = 'text') => ({ entry: [{ changes: [{ value: { messages: [{ id: 'wamid.' + ++n, from, type, timestamp: '1', ...(type === 'text' ? { text: { body: text } } : {}) }] } }] }] });
const post = (payload, sig) => { const raw = JSON.stringify(payload); return handler(new Request('https://x/functions/v1/whatsapp-webhook', { method: 'POST', body: raw, headers: { 'x-hub-signature-256': sig ?? sign(raw) } })); };

const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);

// GET verification
let r = await handler(new Request('https://x/?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=abc123'));
check('GET verify with right token returns challenge', r.status === 200 && (await r.text()) === 'abc123');
r = await handler(new Request('https://x/?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc123'));
check('GET verify with wrong token is 403', r.status === 403);

// Signature
r = await post(msg('27821234567', 'hi'), sign('tampered'));
check('POST with bad signature is 401', r.status === 401 && sent.length === 0);

// hi from allowlisted number
sent.length = 0;
r = await post(msg('27821234567', 'hi'));
check('"hi" from allowlisted number gets a reply', r.status === 200 && sent.length > 0, `(${sent.length} message(s))`);
const menu = sent.map((s) => s.body.text.body).join('\n---\n');
check('reply goes to the sender via the configured number id', sent[0]?.url.includes('/v23.0/1234567890/messages') && sent[0]?.body.to === '27821234567');

// allowlist with + and spaces
sent.length = 0;
await post(msg('27731234567', 'hi'));
check('allowlist entry written as "+27 73 ..." still matches', sent.length > 0);

// not allowlisted
sent.length = 0;
await post(msg('27600000000', 'hi'));
check('number not on allowlist gets no reply', sent.length === 0);

// Menu options
const replies = {};
for (const t of ['2', '3', '6']) { sent.length = 0; await post(msg('27821234567', t)); replies[t] = sent.map((s) => s.body.text.body).join('\n---\n'); check(`reply to "${t}"`, sent.length > 0); }

// Photo refused
sent.length = 0;
await post(msg('27821234567', undefined, 'image'));
check('photo is refused', sent.length === 1 && /can.t accept photos/.test(sent[0].body.text.body));

// ID number refused
sent.length = 0;
await post(msg('27821234567', 'my id is 0501015800087'));
const idReply = sent.map((s) => s.body.text.body).join('\n');
check('ID number gets a refusal', sent.length > 0, JSON.stringify(idReply.slice(0, 90)));

// Retry of the same message id answered once
sent.length = 0;
const dup = msg('27821234567', 'hi');
await post(dup); const first = sent.length; await post(dup);
check('Meta retry of the same message id is answered once', first > 0 && sent.length === first);

// Expired token: still 200 to Meta
graphStatus = 401; sent.length = 0;
r = await post(msg('27821234567', 'hi'));
check('expired token still returns 200 to Meta', r.status === 200);
graphStatus = 200;

// Design rules on bot text
const all = [menu, ...Object.values(replies), idReply].join('\n');
check('no em dashes in bot replies', !all.includes('—'));
check('no emojis in bot replies', !/\p{Extended_Pictographic}/u.test(all));

console.log(results.join('\n'));
const failed = results.filter((x) => x.startsWith('FAIL')).length;
console.log(failed ? `\n${failed} failed` : `\nall ${results.length} passed`);
process.exitCode = failed ? 1 : 0;
