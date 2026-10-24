// Runs supabase/functions/platform/index.ts under Node with a fake Supabase (auth, REST, RPC).
// Usage: npm test (or node --experimental-strip-types tests/platform.test.mjs)
import { pathToFileURL } from 'node:url';

const SB = 'https://fake.supabase.co';
const env = { SUPABASE_URL: SB, SUPABASE_SERVICE_ROLE_KEY: 'service-key', SUPABASE_ANON_KEY: 'anon-key' };
let handler;
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };

const USERS = {
  'tok-tatenda': { id: 'u-1', email: 'tatenda@thutovest.demo' },
  'tok-ridge': { id: 'u-2', email: 'funding@ridgeline.demo' },
  'tok-noprofile': { id: 'u-3', email: 'x@y.z' },
};
const PROFILES = { 'u-1': { role: 'student', app_user_id: 'stu-tatenda' }, 'u-2': { role: 'sponsor', app_user_id: 'sp-ridgeline' } };
let db = null; // { state, version }
let failNextCommit = 0;
let commits = 0;

const jsonRes = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url));
  const h = new Headers(init.headers);
  if (u.pathname === '/auth/v1/user') {
    const user = USERS[(h.get('authorization') ?? '').replace('Bearer ', '')];
    return user ? jsonRes(user) : jsonRes({ msg: 'bad jwt' }, 401);
  }
  if (h.get('apikey') !== 'service-key') return jsonRes({ msg: 'not service role' }, 401);
  if (u.pathname === '/rest/v1/profiles') {
    const id = u.searchParams.get('user_id').replace('eq.', '');
    return jsonRes(PROFILES[id] ? [PROFILES[id]] : []);
  }
  if (u.pathname === '/rest/v1/platform_state') return jsonRes(db ? [structuredClone(db)] : []);
  if (u.pathname === '/rest/v1/rpc/commit_platform_state') {
    const { p_expected, p_state } = JSON.parse(init.body);
    if (failNextCommit > 0) { failNextCommit--; return jsonRes(null); }
    const current = db ? db.version : 0;
    if (p_expected !== current) return jsonRes(null);
    db = { state: p_state, version: current + 1 };
    commits++;
    return jsonRes(db.version);
  }
  return jsonRes({ msg: 'unexpected ' + u.pathname }, 500);
};

await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : new URL('../supabase/functions/platform/index.ts', import.meta.url).href);

const call = async (body, token) => {
  const res = await handler(new Request(`${SB}/functions/v1/platform`, { method: 'POST', body: JSON.stringify(body), headers: token ? { authorization: `Bearer ${token}` } : {} }));
  return { status: res.status, body: await res.json().catch(() => null) };
};
const results = [];
const check = (name, ok, extra = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);

// 1. Signed out
let r = await call({ op: 'load' });
const anon = r.body.state;
check('signed-out load works and seeds the database', r.status === 200 && db?.version === 1);
check('signed-out view has no applications, messages, documents, pool or events', anon.applications.length === 0 && anon.messages.length === 0 && anon.documents.length === 0 && anon.pool.length === 0 && anon.events.length === 0);
check('registration numbers hidden from signed-out visitors', anon.sponsors.every((s) => s.registrationNumber === ''));
const full = db.state;

// 2. Student view
r = await call({ op: 'load' }, 'tok-tatenda');
const stu = r.body.state;
check('student sees only their own applications', stu.applications.every((a) => a.studentId === 'stu-tatenda') && full.applications.some((a) => a.studentId !== 'stu-tatenda'), `(${stu.applications.length} of ${full.applications.length})`);
check('student sees no sponsor decisions', Object.keys(stu.decisions).length === 0);
check('session comes from the token, not the request', r.body.session?.userId === 'stu-tatenda' && r.body.session?.role === 'student');

// 3. Sponsor view
r = await call({ op: 'load' }, 'tok-ridge');
const sp = r.body.state;
const ownFunds = new Set(full.funds.filter((f) => f.sponsorId === 'sp-ridgeline').map((f) => f.id));
check('sponsor sees only applications to their own funds', sp.applications.every((a) => ownFunds.has(a.fundId)));
check('sponsor sees own registration number only', sp.sponsors.find((s) => s.id === 'sp-ridgeline').registrationNumber !== '' && sp.sponsors.filter((s) => s.id !== 'sp-ridgeline').every((s) => s.registrationNumber === ''));

// 4. Attacks
r = await call({ op: 'act', action: { type: 'reset' } });
check('signed-out action is refused (401)', r.status === 401);
r = await call({ op: 'act', action: { type: 'hydrate', state: { ...full, sponsors: [] } } }, 'tok-ridge');
check('replacing the whole state is refused (400)', r.status === 400);
r = await call({ op: 'act', action: { type: 'sendOffer', fundId: [...ownFunds][0], studentId: 'stu-tatenda', studentName: 'Tatenda', amount: 5000, note: '', requiredDocs: [] } }, 'tok-tatenda');
check('student cannot run a sponsor action (403)', r.status === 403);
r = await call({ op: 'act', action: { type: 'expressInterest', fundId: full.funds[0].id, studentId: 'stu-someone-else', studentName: 'X', by: 'student' } }, 'tok-tatenda');
check('student cannot act as another student (403)', r.status === 403);
r = await call({ op: 'load' }, 'tok-noprofile');
check('a login without a profile is treated as signed out', r.body.session === null);

// 5. Real flow: sponsor offer reaches the student
const fundId = [...ownFunds][0];
const before = db.version;
r = await call({ op: 'act', action: { type: 'sendOffer', fundId, studentId: 'stu-tatenda', studentName: 'Tatenda', amount: 60000, note: 'Well done', requiredDocs: ['latest-results'] } }, 'tok-ridge');
check('sponsor offer is accepted and saved', r.status === 200 && db.version === before + 1 && r.body.ownEventIds?.length > 0);
r = await call({ op: 'load' }, 'tok-tatenda');
const offer = r.body.state.applications.find((a) => a.fundId === fundId && a.status === 'offered');
check('student sees the new offer and its event', Boolean(offer) && r.body.state.events.some((e) => e.kind === 'offer' && e.studentId === 'stu-tatenda'));
check('student also sees the requested documents', r.body.state.documents.filter((d) => d.applicationId === offer?.id).length >= 2);

// 6. Moderation runs on the server
r = await call({ op: 'act', action: { type: 'sendMessage', applicationId: offer.id, from: 'sponsor', text: 'Please pay a R500 admin fee to release the bursary' } }, 'tok-ridge');
check('scam message from sponsor is blocked and sponsor suspended on the server', db.state.sponsors.find((s) => s.id === 'sp-ridgeline').status === 'suspended' && db.state.messages.some((m) => m.blocked));
r = await call({ op: 'act', action: { type: 'sendMessage', applicationId: offer.id, from: 'sponsor', text: 'hi' } }, 'tok-tatenda');
check('student cannot send a message as the sponsor (403)', r.status === 403);

// 7. Candidate publishing is sanitised
r = await call({ op: 'act', action: { type: 'publishCandidate', profile: { id: 'stu-other', firstName: 'Fake' } } }, 'tok-tatenda');
check('student cannot publish someone else’s profile (403)', r.status === 403);
r = await call({ op: 'act', action: { type: 'publishCandidate', profile: { id: 'stu-tatenda', firstName: 'Tatenda', surname: 'Secret', idNumber: '0501015800087', trust: 9, gap: -5, onTimeRate: 7, discoverable: true, checks: { identity: 'verified', hacked: 'x' } } } }, 'tok-tatenda');
const pub = db.state.pool.find((p) => p.id === 'stu-tatenda');
check('published profile is whitelisted (no surname or ID, values clamped)', r.status === 200 && pub && !('surname' in pub) && !('idNumber' in pub) && pub.trust === 0 && pub.gap === 0 && pub.onTimeRate === 1 && !('hacked' in pub.checks) && pub.isLive === true);

// 7b. Sponsors cannot verify themselves
r = await call({ op: 'act', action: { type: 'setSponsorCheck', sponsorId: 'sp-community', key: 'bank', item: { status: 'verified' } } }, 'tok-ridge');
const r2 = await call({ op: 'act', action: { type: 'setSponsorCheck', sponsorId: 'sp-ridgeline', key: 'bank', item: { status: 'verified' } } }, 'tok-ridge');
check('sponsor cannot set any verification result, even its own (403)', r.status === 403 && r2.status === 403);

// 8. Lost race is retried
failNextCommit = 1;
const c0 = commits;
r = await call({ op: 'act', action: { type: 'reset' } }, 'tok-tatenda');
check('a write that loses a race is retried and succeeds', r.status === 200 && commits === c0 + 1);

// 9. Junk input
let res = await handler(new Request(`${SB}/functions/v1/platform`, { method: 'POST', body: 'not json' }));
check('malformed body is rejected (400)', res.status === 400);
res = await handler(new Request(`${SB}/functions/v1/platform`, { method: 'OPTIONS', headers: { origin: 'https://thutovest.vercel.app' } }));
check('CORS preflight answers', res.status === 200 && res.headers.get('access-control-allow-origin'));

console.log(results.join('\n'));
const failed = results.filter((x) => x.startsWith('FAIL')).length;
console.log(failed ? `\n${failed} failed` : `\nall ${results.length} passed`);
process.exitCode = failed ? 1 : 0;
