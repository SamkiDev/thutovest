// Read-only / must-be-refused probes against the live Supabase project. Prints no keys or tokens.
// Usage: npm run test:live (reads the public URL and anon key from .env.local, or pass another env file)
import { readFileSync } from 'node:fs';
const t = readFileSync(process.argv[2] ?? new URL('../.env.local', import.meta.url), 'utf8');
const g = (k) => (t.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1].trim();
const U = g('VITE_SUPABASE_URL'), K = g('VITE_SUPABASE_ANON_KEY');
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`);
const H = (tok) => ({ apikey: K, Authorization: 'Bearer ' + (tok || K), 'content-type': 'application/json' });
const rest = async (path, tok, init = {}) => { const r = await fetch(U + '/rest/v1/' + path, { ...init, headers: { ...H(tok), Prefer: 'return=representation', ...(init.headers || {}) } }); let b = null; try { b = await r.json(); } catch {} return { status: r.status, body: b }; };
const fn = async (body, tok, raw) => { const r = await fetch(U + '/functions/v1/platform', { method: 'POST', headers: H(tok), body: raw ?? JSON.stringify(body) }); let b = null; try { b = await r.json(); } catch {} return { status: r.status, body: b }; };
const login = async (email) => (await (await fetch(U + '/auth/v1/token?grant_type=password', { method: 'POST', headers: H(), body: JSON.stringify({ email, password: 'Demo#2026' }) })).json());
const denied = (r) => r.status >= 400 || (Array.isArray(r.body) && r.body.length === 0);

// ---- Signed out
const TABLES = ['platform_state', 'student_states', 'profiles', 'platform_ticks', 'whatsapp_links', 'whatsapp_link_codes', 'bot_snapshots', 'scam_reports'];
for (const tb of TABLES) {
  const r = await rest(tb + '?select=*&limit=5');
  const leak = Array.isArray(r.body) && r.body.length > 0 && !(tb === 'platform_ticks' && r.body.every((x) => Object.keys(x).every((k) => ['id', 'version', 'updated_at'].includes(k))));
  check(`signed out cannot read ${tb}`, !leak, `${r.status}, ${Array.isArray(r.body) ? r.body.length + ' rows' : 'refused'}`);
}
let r = await rest('rpc/commit_platform_state', null, { method: 'POST', body: JSON.stringify({ p_expected: 0, p_state: {} }) });
check('signed out cannot call commit_platform_state', r.status >= 400, String(r.status));
r = await fn({ op: 'act', action: { type: 'reset' } });
check('signed out action refused (401)', r.status === 401, String(r.status));
const forged = 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ sub: 'x', role: 'authenticated', email: 'tatenda@thutovest.demo' })).toString('base64url') + '.c2ln';
r = await fn({ op: 'act', action: { type: 'reset' } }, forged);
check('forged login token refused', r.status === 401, String(r.status));
r = await fn(null, null, 'x'.repeat(3_300_000));
check('oversized request refused (413)', r.status === 413, String(r.status));

// ---- Tatenda (student)
const st = await login('tatenda@thutovest.demo');
const S = st.access_token;
check('student login works', Boolean(S));
r = await rest('student_states?select=user_id', S);
check('student sees only own saved state', Array.isArray(r.body) && r.body.length <= 1 && r.body.every((x) => x.user_id === st.user.id), `${r.body?.length} rows`);
r = await rest('profiles?select=*', S);
check('student sees only own profile', Array.isArray(r.body) && r.body.length === 1, `${r.body?.length} rows`);
const myProfile = r.body?.[0];
r = await rest('profiles?user_id=eq.' + st.user.id, S, { method: 'PATCH', body: JSON.stringify({ role: 'sponsor' }) });
check('student cannot make themself a sponsor', denied(r), String(r.status));
r = await rest('profiles?select=*', S);
check('profile unchanged afterwards', JSON.stringify(r.body?.[0]) === JSON.stringify(myProfile));
r = await rest('student_states', S, { method: 'POST', body: JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000000', state: {} }) });
check('student cannot write another user’s state', r.status >= 400, String(r.status));
r = await rest('platform_state?select=*', S);
check('student cannot read the raw marketplace table', denied(r), String(r.status));
r = await rest('rpc/commit_platform_state', S, { method: 'POST', body: JSON.stringify({ p_expected: 0, p_state: {} }) });
check('student cannot call commit_platform_state', r.status >= 400, String(r.status));
r = await rest('whatsapp_links?select=*', S);
check('student sees no one else’s WhatsApp link', denied(r) || r.body.every((x) => x.user_id === st.user.id), `${r.status}`);

const load = await fn({ op: 'load' }, S);
const v0 = load.body?.version;
const apps = load.body?.state?.applications?.map((a) => a.studentId) ?? [];
check('student load only contains own applications', apps.length > 0 && apps.every((id) => id === 'stu-tatenda'), apps.join(','));
const other = JSON.stringify(load.body?.state?.messages ?? []);
check('student load has no other students’ messages', !/Lerato|Ayesha/.test(other));
const attacks = [
  ['sendOffer as student', { type: 'sendOffer', fundId: 'fund-ridge-dev', studentId: 'stu-tatenda', studentName: 'Tatenda', amount: 60000, note: 'x', requiredDocs: [] }],
  ['closeFund on Ridgeline fund', { type: 'closeFund', fundId: 'fund-ridge-dev' }],
  ['self-verify scam sponsor', { type: 'setSponsorCheck', sponsorId: 'sp-quickbursary', key: 'bank', item: { status: 'verified', updatedAt: new Date().toISOString() } }],
  ['pay another student’s award', { type: 'payInstitution', applicationId: 'app-lerato', institution: 'TUT', studentName: 'Lerato' }],
  ['accept another student’s offer', { type: 'respondOffer', applicationId: 'app-lerato', accept: true, studentName: 'Lerato' }],
  ['hydrate (replace everything)', { type: 'hydrate', state: {} }],
];
for (const [name, action] of attacks) { r = await fn({ op: 'act', action }, S); check(`student refused: ${name}`, r.status === 403 || r.status === 400, String(r.status)); }
const after = await fn({ op: 'load' }, S);
check('marketplace unchanged by refused actions', after.body?.version === v0, `version ${v0} -> ${after.body?.version}`);

// Demo password change exposure (same password: never changes anything)
const pw = await fetch(U + '/auth/v1/user', { method: 'PUT', headers: H(S), body: JSON.stringify({ password: 'Demo#2026' }) });
const pwBody = await pw.json().catch(() => ({}));
results.push(`INFO  demo password change endpoint: ${pw.status} ${pwBody.error_code || pwBody.code || ''} ${(pwBody.msg || pwBody.message || '').slice(0, 80)}`);

// ---- Ridgeline (sponsor)
const sp = await login('funding@ridgeline.demo');
const P = sp.access_token;
check('sponsor login works', Boolean(P));
r = await rest('student_states?select=user_id', P);
check('sponsor cannot read students’ saved states', denied(r) || r.body.every((x) => x.user_id === sp.user.id), `${r.body?.length ?? r.status}`);
const sl = await fn({ op: 'load' }, P);
const fundsOwn = new Set(sl.body?.state?.funds?.filter((f) => f.sponsorId === 'sp-ridgeline').map((f) => f.id));
const sApps = sl.body?.state?.applications ?? [];
check('sponsor load only contains applications to own funds', sApps.length > 0 && sApps.every((a) => fundsOwn.has(a.fundId)), `${sApps.length} apps`);
const regs = (sl.body?.state?.sponsors ?? []).filter((s) => s.id !== 'sp-ridgeline').map((s) => s.registrationNumber);
check('other sponsors’ registration numbers hidden from sponsor', regs.every((x) => !x), regs.join(','));
const poolText = JSON.stringify(sl.body?.state?.pool ?? []);
check('sponsor sees no surnames or ID numbers', !/surname|idNumber|\b\d{13}\b/.test(poolText));
for (const [name, action] of [
  ['close another sponsor’s fund', { type: 'closeFund', fundId: 'fund-community-first' }],
  ['self-verify own bank', { type: 'setSponsorCheck', sponsorId: 'sp-ridgeline', key: 'bank', item: { status: 'verified', updatedAt: new Date().toISOString() } }],
  ['accept an offer for a student', { type: 'respondOffer', applicationId: 'app-lerato', accept: true, studentName: 'Lerato' }],
]) { r = await fn({ op: 'act', action }, P); check(`sponsor refused: ${name}`, r.status === 403 || r.status === 400 || (r.status === 200 && r.body?.version === sl.body?.version), String(r.status)); }

// ---- Auth settings
const set = await (await fetch(U + '/auth/v1/settings', { headers: { apikey: K } })).json();
results.push(`INFO  sign-ups disabled: ${set.disable_signup}, email auto-confirm: ${set.mailer_autoconfirm}, phone sign-up: ${set.external?.phone}`);

console.log(results.join('\n'));
const failed = results.filter((x) => x.startsWith('FAIL')).length;
console.log(failed ? `\n${failed} failed` : `\nall ${results.filter((x) => x.startsWith('PASS')).length} passed`);
process.exitCode = failed ? 1 : 0;
