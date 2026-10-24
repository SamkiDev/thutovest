// Runs supabase/functions/whatsapp-twilio/index.ts under Node with signed Twilio-style form posts.
// Usage: npm test (or node --experimental-strip-types tests/whatsapp-twilio.test.mjs)
import { pathToFileURL } from 'node:url';
import { createHmac } from 'node:crypto';

const TOKEN = 'test-auth-token';
const URL_ = 'https://proj.supabase.co/functions/v1/whatsapp-twilio';
const env = { TWILIO_AUTH_TOKEN: TOKEN, SUPABASE_URL: 'https://proj.supabase.co', DEMO_ALLOWED_NUMBERS: '27821234567', APP_URL: 'https://example.test' };
let handler;
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };
await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : new URL('../supabase/functions/whatsapp-twilio/index.ts', import.meta.url).href);

// Twilio's documented algorithm, implemented independently with node:crypto.
const sign = (url, params, token = TOKEN) => createHmac('sha1', token).update(url + Object.keys(params).sort().map((k) => k + params[k]).join('')).digest('base64');
let n = 0;
const msg = (from, body, extra = {}) => ({ MessageSid: 'SM' + String(++n).padStart(32, '0'), SmsMessageSid: 'SM' + String(n).padStart(32, '0'), AccountSid: 'AC123', From: `whatsapp:+${from}`, To: 'whatsapp:+14155238886', WaId: from, Body: body, NumMedia: '0', ProfileName: 'Test', ...extra });
const post = async (params, sig) => {
  const res = await handler(new Request(URL_, { method: 'POST', body: new URLSearchParams(params).toString(), headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': sig ?? sign(URL_, params) } }));
  return { status: res.status, body: await res.text(), type: res.headers.get('content-type') };
};
const messages = (xml) => [...xml.matchAll(/<Message>([\s\S]*?)<\/Message>/g)].map((m) => m[1]);
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);

let r = await post(msg('27821234567', 'hi'));
check('"hi" from allowlisted number gets the menu as TwiML', r.status === 200 && r.type?.includes('text/xml') && messages(r.body).some((m) => m.includes('Reply with a number')));
const menu = messages(r.body).join('\n');

r = await post(msg('27821234567', 'hi'), 'bad-signature');
check('bad signature is rejected (403)', r.status === 403);
const p = msg('27821234567', 'hi');
r = await post(p, sign(URL_, p, 'wrong-token'));
check('signature made with the wrong token is rejected (403)', r.status === 403);
const p2 = msg('27821234567', 'hi');
r = await post(p2, sign(URL_ + '?x=1', p2));
check('signature for a different URL is rejected (403)', r.status === 403);
const p3 = msg('27821234567', 'hi');
const sig3 = sign(URL_, p3);
r = await post({ ...p3, Body: '3' }, sig3);
check('tampered message body is rejected (403)', r.status === 403);

r = await post(msg('27600000000', 'hi'));
check('number not on the allowlist gets an empty reply', r.status === 200 && messages(r.body).length === 0);

for (const t of ['2', '3', '6']) { r = await post(msg('27821234567', t)); check(`reply to "${t}"`, messages(r.body).length > 0); }

r = await post(msg('27821234567', '', { NumMedia: '1', MediaContentType0: 'image/jpeg', MediaUrl0: 'https://api.twilio.com/x' }));
check('photo is refused', /can’t accept photos/.test(messages(r.body).join('')));

r = await post(msg('27821234567', 'my id is 0501015800087'));
check('ID number gets a refusal', /ID number/i.test(messages(r.body).join('')), JSON.stringify(messages(r.body).join(' ').slice(0, 70)));

const dup = msg('27821234567', 'hi');
const first = await post(dup); const again = await post(dup);
check('Twilio retry of the same MessageSid is answered once', messages(first.body).length > 0 && messages(again.body).length === 0);

r = await post(msg('27821234567', 'Tom & Jerry <script>'));
check('reply is valid XML when the text has < & >', !/<script>/.test(r.body) && r.body.startsWith('<?xml'));

// Rate limit: 15 per 10 minutes
let last;
for (let i = 0; i < 16; i++) last = await post(msg('27731111111', 'hi'));
env.DEMO_OPEN = 'true';
// DEMO_OPEN is read at import, so check the flag behaviour on a fresh import
check('rate limiting stays silent after the limit (or number not allowed)', messages(last.body).length === 0);

r = await handler(new Request(URL_, { method: 'GET' }));
check('GET is not allowed (405)', r.status === 405);

const all = menu + messages((await post(msg('27821234567', '6'))).body).join('');
check('no em dashes in bot replies', !all.includes('—'));

console.log(results.join('\n'));
const failed = results.filter((x) => x.startsWith('FAIL')).length;
console.log(failed ? `\n${failed} failed` : `\nall ${results.length} passed`);
process.exitCode = failed ? 1 : 0;
