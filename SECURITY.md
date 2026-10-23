# Security review

Reviewed 22 October 2026, before the hackathon build. ThutoVest is currently a
browser-only React app with no server, database or API. Data lives in
`localStorage`/`sessionStorage` on one device. Items that need a server are
marked **N/A (now)** and listed under "Required when the Supabase backend lands".

| # | Check | Status | Where / what was done |
|---|---|---|---|
| 1 | API keys in env vars, never in client code | Pass | No API keys exist. `.env.example` added, documenting that only public `VITE_` values may reach the browser. |
| 2 | Secrets purged from Git history; `.gitignore`; rotate leaked keys | Pass (fixed) | No Git history yet and no secrets to rotate. `.gitignore` now ignores `.env*`, `*.local`, `*.pem`, `*.key`. |
| 3 | Only public/anon DB keys on the client | N/A (now) | No database. `.env.example` limits the client to `VITE_SUPABASE_ANON_KEY`; the service_role key must never be a `VITE_` variable. |
| 4 | Row-level security enabled | N/A (now) | No database. Rules to port are in `src/platform/authorize.ts`. |
| 5 | Sensitive data encrypted | Fail → mitigated | Browser storage is not encrypted. Fixed what we can: ID copies are no longer stored as an image preview (`UploadDocumentModal.tsx:109`), and ID numbers were already never stored. Full fix: Supabase Storage private bucket (encrypted at rest) and TLS. |
| 6 | Auth enforced server-side | N/A (now) | Sign-in is a client-side demo (`SignInPage.tsx:46`). Must move to Supabase Auth. |
| 7 | Record access locked to owners | Fixed (client) | Every platform action now goes through `authorize()` (`src/platform/authorize.ts:51`), wired in `PlatformProvider.tsx:27`. Students act only on their own applications; sponsors only on their own funds, applications and document shares. 17 rule tests pass. |
| 8 | Field tampering blocked (whitelist) | Fixed (client) | `sanitizeFund` (`authorize.ts:143`) forces `sponsorId`, `status` and `createdAt`. `sanitizeSponsor` (`authorize.ts:168`) forces every check to "not started", so a sponsor can't self-verify. Unknown document kinds are stripped. Tampered storage is rejected by `isPlatformState` (`authorize.ts:193`). |
| 9 | Secure session cookies (HttpOnly, Secure, SameSite) | N/A (now) | No cookies. The demo session is in `sessionStorage` (`dataStore.ts:58`), one per tab. |
| 10 | Passwords hashed (bcrypt/argon2) | N/A (now) | No user passwords are collected. The two demo passwords are deliberately public (shown on the sign-in page and slides). Real accounts will use Supabase Auth (bcrypt). |
| 11 | Login rate limited | N/A (now) | No server login. Supabase Auth rate-limits sign-in by default; keep it on. |
| 12 | Bot protection on forms | N/A (now) | Nothing is submitted to a server. Add Cloudflare Turnstile (Supabase Auth CAPTCHA) on sign-up and sponsor registration. |
| 13 | Parameterized queries only | N/A (now) | No SQL. The Supabase JS client sends parameters, never string-built SQL; don't use `.rpc` with concatenated SQL. |
| 14 | All input validated server-side | Partial (client) | Length and range limits in `authorize.ts:15` (messages 1,000 chars, notes 500, amounts above 0 and at most R1m) plus `maxLength` on every free-text field. Registration numbers are re-validated. Must be repeated in database constraints and server functions. |
| 15 | User content escaped (XSS) | Pass | React escapes all text. No `dangerouslySetInnerHTML`, `innerHTML` or `eval` anywhere in `src/`. No user-supplied URLs are rendered as links. CSP adds a second layer. |
| 16 | File uploads restricted by type and size | Fixed | 8 MB limit, empty files rejected, and a type allowlist checked against the file's own first bytes (`documents.ts:62`), so a renamed `.exe` or `.html` is refused. File names are sanitised. Repeat on the server. |
| 17 | API responses trimmed to needed fields | N/A (now) | No API. Sponsors already only receive `CandidateProfile` (first name, province, field, band; no surname or ID) and per-award document snapshots. |
| 18 | Security headers | Fixed | `vercel.json`: CSP (`script-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`), HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP. |
| 19 | HTTPS forced | Fixed | Vercel redirects HTTP to HTTPS. HSTS (2 years, preload) and `upgrade-insecure-requests` added. |
| 20 | Dependencies scanned | Not run here | The npm registry isn't reachable from the build machine. Added `npm run audit` and `.github/dependabot.yml` (weekly). Run `npm install && npm run audit` before submitting. |

## Supabase backend (built 23 October 2026)

Live on 23 October 2026. Checked against the live project: signed-out callers get only public sponsors and open funds, actions without a login are refused (401), and browsers get "permission denied" on `platform_state`. Without the two public `VITE_SUPABASE_*` values the app keeps running browser-only, as described above.

- **Authentication on the server:** demo accounts are real Supabase Auth users (bcrypt hashes, seeded in `supabase/migrations/20261023150000_platform.sql`). The `platform` Edge Function verifies the caller's token with `auth/v1/user` and maps it to an app account through `profiles`. The browser never says who it is.
- **Authorization on the server:** every marketplace action runs `authorize()` and `platformReducer()` inside the Edge Function, bundled from the same source as the app (`npm run build:server`). Ownership checks, field whitelists, amount limits and scam-message moderation are therefore enforced server-side. Replacing the whole state (`hydrate`) is refused.
- **RLS on every table:** `platform_state` has RLS and no policies, so browsers can't reach it at all; only the function (service role) can. `student_states` is owner-only. `profiles` is read-own only. `platform_ticks` exposes nothing but a version number. Writes go through `commit_platform_state`, a `security definer` function only the service role may execute, with an optimistic version check.
- **Responses trimmed per account (check 17):** `projectFor()` sends a student only their own applications, messages, documents and events; a sponsor only applications to their own funds; other sponsors' registration numbers are blanked.
- **Published student profiles are whitelisted:** `publishCandidate` keeps only anonymised fields and clamps every number, so a surname or ID number sent by a modified browser is dropped.
- **Other limits:** 3 MB request cap, 40 actions per minute per account, no request bodies or personal data in logs, one login per browser tab (sessionStorage).
- **Tests:** 23 checks against a mocked Supabase passed, including signed-out actions, a student posing as another student or as a sponsor, whole-state replacement, forged candidate fields, server-side scam blocking and a lost write race.
- **Known gaps:** trust levels in published profiles are still computed in the browser (the verification service would set them in production). Any demo account can use "Reset demo", which resets the shared demo data for everyone. New sponsor and student sign-ups still run browser-only.

## WhatsApp bot

- **Webhook:** checks Meta's HMAC-SHA256 signature on every request, answers each message ID once, and rate-limits to 15 messages per 10 minutes per number. Demo mode only answers allowlisted numbers.
- **What it refuses:** ID numbers, card numbers, OTPs and bank details, before any processing, plus every file and voice note.
- **Linking:** the 6-digit code comes from `crypto.getRandomValues`, lasts 10 minutes, is stored hashed in live mode and must be sent from the number being linked. Consent is recorded.
- **Data access:** the bot only reads a minimal snapshot, with no surname, ID, documents or message contents. Tables have RLS, and a column grant lets students change only `opted_out` and `alert_prefs` (`supabase/migrations/20261023120000_whatsapp.sql`).
- **Logging:** message text and phone numbers are never logged. Secrets live only in Supabase function secrets.
- **Tests:** 37 bot and signature tests and 10 webhook tests passed. The webhook tests run the real function against a mocked Graph API.

## Required when the Supabase backend lands

1. Enable RLS on every table and port each rule in `authorize.ts` to a policy, for example `applications`: a student can read rows where `student_id = auth.uid()`; a sponsor can read rows whose fund has `sponsor_id = auth.uid()`.
2. Do state changes such as offer, approve and pay in Edge Functions or `security definer` RPCs, not direct table updates. Grant `update` only on columns a user may change.
3. Put documents in a **private** Storage bucket. Storage policies give the owner access, plus the sponsor of a share whose status is `shared` or `approved`. Use short-lived signed URLs.
4. Use Supabase Auth with email confirmation, CAPTCHA on sign-up and default rate limits.
5. Move checks such as message moderation, the file signature check and amount limits into server functions. Keep the client checks as UX.
6. Keep the `service_role` key only in Edge Function secrets. Rotate it if it is ever committed.
