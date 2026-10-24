# ThutoVest

**From “I want to study” to “I can graduate.”**

ThutoVest walks a South African matriculant from choosing a course to starting first year. It builds a personal plan, warns them before a deadline, document or funding gap becomes a problem, and connects them with **verified sponsors who pay the institution directly**. Students low on data can follow along on WhatsApp.

Built by **Team Thuto** for the FNB App of the Year Hackathon 2026, challenge **Access to Higher Education**. "Thuto" means learning in Setswana and Sesotho; "vest" means investing in a student.

> **This is a prototype.** Every sponsor, student and award in it is fictional and labelled as demo data. Identity checks, bank checks and payments are simulated. Institution links, TVET colleges and the private college register are real and sourced. See [What is real and what is simulated](#what-is-real-and-what-is-simulated).

## Try it live

**https://thutovest.vercel.app** works on any phone or laptop.

| Sign in as | Email | Password |
| --- | --- | --- |
| Student (Tatenda, Grade 12, 17) | `tatenda@thutovest.demo` | `Demo#2026` |
| Sponsor (Ridgeline Technologies) | `funding@ridgeline.demo` | `Demo#2026` |

The sign-in page has one-click buttons for both. The demo passwords are public on purpose and locked, so nobody can change them.

- **Watch it live:** open the student and the sponsor in two tabs, or on two phones. Offers, documents and payments appear on the other side in about 2 seconds.
- **WhatsApp:** send `join salmon-castle` to **+1 415 523 8886**, then `hi`. (Twilio sandbox; replies come from the demo student.)
- **Start fresh:** tap **Get started** to build your own plan. It is saved on your device only.

## Try it in three minutes

1. **Student:** sign in as Tatenda. The assistant has found a Ridgeline bursary match. Approve **Share my profile**.
2. **Sponsor:** sign in as Ridgeline in another tab. Open **Candidates**, choose Tatenda and **Make offer**. The admission letter is always required.
3. **Student:** the offer arrives live. Open **Sponsors**, then **Review, sign and accept**. Tatenda is 17, so her guardian Nomsa co-signs.
4. **Student:** open **Documents** and **Upload and share** the admission letter. Tick "simulate an edited document" first to see a forgery caught.
5. **Sponsor:** approve the documents, then **Approve funding** and **Pay institution**. Payment stays locked until every required document is approved, and it only ever goes to the institution.
6. **Safety:** as the sponsor, send "pay a R500 admin fee". The message is blocked and the sponsor suspended.

The demo data is shared by everyone using the demo accounts. **Reset demo** in the menu restores it for everyone.

## Run it locally

Requires **Node.js 20.19+ or 22.12+**.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck and production build to dist/
```

Without any settings the app runs fully in the browser: data is kept on the device and syncs between open tabs. To use the live backend, copy `.env.example` to `.env.local` and fill in the two **public** values (the Supabase project URL and anon key). Nothing secret ever goes in a `VITE_` variable.

**Deploy:** Vercel builds `main` automatically (`npm run build`, output `dist`). Set the same two `VITE_SUPABASE_*` values in the Vercel project. Backend setup is in [`supabase/`](supabase/) and the WhatsApp bot in [`supabase/functions/whatsapp-webhook/README.md`](supabase/functions/whatsapp-webhook/README.md).

## How it is put together

```
browser (React) ──► Edge Function: platform ──► Postgres (row-level security)
      ▲             same authorize() and rules          │
      │             as the app                          │
      └──────────── Realtime: version ticks ◄───────────┘

phone ──► Twilio WhatsApp ──► Edge Function: whatsapp-twilio ──► shared bot logic
```

**The rule:** the browser is never trusted. It does not decide who it is, what status a record has or whether anything is verified. Every marketplace action goes to the `platform` function, which checks the login token, runs the same `authorize()` rules and reducer the app uses (bundled from one source, so the two can never disagree) and commits with a version check. Each account gets back only what it may see.

| Directory | What lives there |
| --- | --- |
| `src/pages/`, `src/pages/sponsor/` | Student screens and sponsor screens |
| `src/intelligence/` | Forecasts, the assistant, sponsor matching and learning, scam moderation, document checks |
| `src/platform/` | Marketplace state: `authorize.ts` (who may do what), `platformReducer.ts` (every action), the backend connection |
| `src/state/` | The student's own plan and progress |
| `src/data/` | Official institution data with sources, plus the labelled demo marketplace |
| `src/server/core.ts` | Entry point bundled into the server function by `npm run build:server` |
| `supabase/migrations/` | Tables, row-level security, the demo accounts and the demo login lock |
| `supabase/functions/` | `platform` (marketplace API), `whatsapp-twilio` (live bot), `whatsapp-webhook` (Meta version) |
| `tests/` | Server, webhook and live security tests |

**Stack:** React 19, TypeScript (strict), Vite, Tailwind CSS v4, Supabase (Auth, Postgres, Realtime, Edge Functions), Vercel, Twilio.

## How the app thinks

| What it predicts | What it learns from | Where |
| --- | --- | --- |
| Which deadlines you will miss at your current pace | Your task completion history | `src/intelligence/forecast.ts` |
| When you are most likely to act, so reminders land then | The hour and weekday of your past actions | `forecast.ts` |
| The month your money runs out | Your costs, funding and payment timing | `forecast.ts` |
| Which students a sponsor will prefer | That sponsor's past shortlist, offer and pass decisions | `src/intelligence/marketplace.ts` |
| When a fund will be used up | Award pace against budget and closing date | `marketplace.ts` |
| Scam and off-platform attempts | Message content: fee requests, contact and bank details | `src/intelligence/moderation.ts` |

The assistant (`src/intelligence/agent.ts`) acts on low-risk items itself, such as reminders and blocking scams, and asks first before anything that shares data or commits the student. It never accepts an offer for the student. Every alert has a **Why?** panel showing the evidence. These are explainable rules built on each user's own data, not machine learning.

## Testing

```bash
npm run typecheck    # TypeScript, strict
npm run build        # production build
npm run audit        # known vulnerabilities in dependencies
npm test             # 56 offline checks, no network or keys needed
npm run test:live    # 38 attack probes against the live backend (changes nothing)
```

- `npm test` runs the real Edge Functions under Node with Supabase, Twilio and Meta mocked: 24 server checks (signed-out actions, a student posing as another student or a sponsor, forged profile fields, scam blocking, sponsor self-verification, a lost write race) and 32 webhook checks (bad, re-signed and tampered signatures, replays, rate limits, refused ID numbers and files, XML injection).
- `npm run test:live` reads the public values from `.env.local` and tries what an attacker would: reading every table signed out, forged tokens, oversized requests, students and sponsors acting on each other's records, and replacing the whole state. Every probe must be refused and the data must be unchanged afterwards.

## Security

Full write-up: **[SECURITY.md](SECURITY.md)**. In short:

- Supabase Auth logins (bcrypt), checked on the server for every action
- Row-level security on every table; the marketplace table is not reachable from browsers at all
- Sponsors see anonymised profiles only: no surname, no ID number. No ID numbers are stored anywhere.
- Under-18s need guardian consent, and a guardian co-signs every agreement
- Fee requests and bank-detail requests are blocked and the sender suspended; sponsors cannot verify themselves
- Uploads are checked by their real file contents; WhatsApp refuses ID numbers, OTPs, bank details and files
- Signed webhooks, strict Content Security Policy, HSTS, no secrets in code or history

## What is real and what is simulated

**Real**

- The live app, logins, server-side rules, row-level security and live sync between devices
- The WhatsApp bot on real phones (Twilio sandbox)
- University application, financial aid and residence links for 13 universities (checked 19 October 2026), all 50 public TVET colleges with their NSFAS accommodation portals (checked 23 October 2026), and the DHET Register of Private Higher Education Institutions (14 October 2026 update)
- The NSFAS 2026 accommodation rules used by "Check a place before you pay"
- Document type, readability and tamper checks; scam moderation; forecasts and sponsor learning

**Simulated, and labelled in the app**

- Identity, guardian and bank verification, payments to institutions, and institution confirmations
- Every sponsor, student and award in the marketplace
- Fees, APS guides and some deadlines in the Study Explorer
- The Navigator chat, which uses scripted answers

**Not built yet**

- Real sign-up through Supabase Auth (new accounts are saved on the device), MFA and stronger password rules
- Private document storage on the server (documents stay on the device)
- Automated tests in CI, an audit log, and point-in-time backups

See the planned list in [SECURITY.md](SECURITY.md).
