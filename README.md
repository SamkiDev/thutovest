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
| One student login per judge | `judge1@thutovest.demo` to `judge5@thutovest.demo` | `Demo#2026` |
| University student (Nandi, first-year at UJ, funded by Ridgeline) | `nandi@thutovest.demo` | `Demo#2026` |

The sign-in page has one-click buttons for all of them. Each judge login starts from the same story as Tatenda (a Grade 12 learner with a guardian's consent on file) under its own name, with a plan of its own, so judges don't change each other's work. The demo passwords are public on purpose and locked, so nobody can change them.

- **Watch it live:** open the student and the sponsor in two tabs, or on two phones. Offers, documents and payments appear on the other side in about 2 seconds.
- **WhatsApp:** in the app, open **WhatsApp updates** and tap **Open WhatsApp** under *Talk to ThutoVest*. Or send `join salmon-castle` to **+1 415 523 8886** yourself, then `hi`. Any phone can join. The bot always answers with the demo student Tatenda's updates, whoever is messaging; see [WhatsApp today and next](#whatsapp-today-and-next).
- **Start fresh:** tap **Get started** to build your own plan. It is saved on your device only.

## Try it in three minutes

1. **Student:** sign in as Tatenda. The assistant has found a Ridgeline bursary match. Approve **Share my profile**.
2. **Sponsor:** sign in as Ridgeline in another tab. Open **Candidates**, choose Tatenda and **Make offer**. The admission letter is always required.
3. **Student:** the offer arrives live. Open **Sponsors**, then **Review, sign and accept**. Ridgeline's own terms are in the agreement (it pays tuition and accommodation, with a 60% pass mark and one year of work-back). Tatenda is 17, so her guardian Nomsa co-signs. Her funding gap then drops from R92,400 to R32,400, and other sponsors only see what is left.
4. **Student:** open **Documents** and **Upload and share** the admission letter. Tick "simulate an edited document" first to see a forgery caught.
5. **Sponsor:** approve the documents, then **Approve funding** and **Pay institution**. Payment stays locked until every required document is approved, and it only ever goes to the institution.
6. **Safety:** as the sponsor, send "pay a R500 admin fee". The message is blocked and the sponsor suspended.
7. **Student progress:** open **Marks and progress**, tap **Use a sample report**, then **Save and analyse**. Maths and Physical Sciences slip, the APS drops from 31 to 30, and the advice names the saved courses now out of reach.
8. **University student:** sign in as Nandi, a first-year whose Ridgeline bursary is paid. In **Marks and progress**, tap **Use a sample report** and **Save and analyse**: Mathematics 1A falls from 62% to 55%. Send Ridgeline a **tutor request** for it.
9. **Sponsor:** on the overview, **Student progress** shows Nandi's new module marks and her request, and Zanele, a first-year at Nelson Mandela University, below Ridgeline's 60% pass mark, with her module marks (Data Structures and Algorithms at 44%). Send her an **early warning** and arrange the tutor she asked for.

**Reset demo** in the menu puts your own account back to the start: your plan, applications, offers and messages. Other demo accounts are not affected.

## What it does

**For students (free)**

- A personal plan from choosing a course to first year, with one next best action at every step
- Course matches by field, APS, budget, province and preferred institutions. Change the APS and every match is re-scored. Every field has at least six options, including diplomas and higher certificates for lower APS scores.
- Marks and progress: each time a student adds marks (typed, or read from a report), the app works out the average, the change since last time, the APS and the subjects slipping, compares them with the bursary's pass mark, and says what to do next. A student at university or college with a bursary can ask their sponsor for a tutor in one tap.
- Risk Radar: early warnings for deadlines, missing documents and money gaps, each with its reason
- Funding Gap Solver: NSFAS, ISFAP, Funza Lushaka, university aid and loans in one view
- All 26 public universities, all 50 public TVET colleges and the DHET private college register, with official links
- "Check a place before you pay": NSFAS 2026 accommodation rules and scam signs, before a student pays a deposit
- A document vault with automatic checks, shared with a sponsor in one tap
- WhatsApp: **Talk to ThutoVest** for students who are low on data

**For sponsors**

- Candidates ranked by fit and by what this sponsor tends to fund
- Funds with their own terms: what the bursary pays for (tuition, accommodation, books, transport, living costs or the full cost), a minimum pass mark, work-back years, and whether it must be the student's only bursary
- Offers, document review, funding approval and payment to the institution, with a forecast of when each fund runs out
- Student progress for the students they fund: every subject or module mark as it comes in, flagged when a student slips below the pass mark. The sponsor can send an early warning, worded by the platform so it is fair: it states the requirement, says no decision has been made, and offers help. Tutor requests are answered from the same place.
- Only the sponsor funding a student sees their marks, as the bursary agreement asks. Other sponsors never do, and the report file itself is never shared

**Fair funding rules, enforced on the server**

- A student holds at most two sponsor bursaries, so one can pay tuition and another the rest
- Sponsors see the gap left after other bursaries, and no offer or acceptance can go above it
- An "only bursary" can't be combined with another
- Money only ever goes to the institution

**Children (under 18)**

POPIA treats under-18s as children, and a minor can't sign a bursary agreement alone, so:

- A parent or guardian reads and ticks a consent statement on the Verification page. The exact wording and time are kept, and the consent form goes into the student's documents.
- Until then the child is hidden from every sponsor and can't share their profile, enforced on the server.
- Every offer to an under-18 automatically requires the guardian consent form, the guardian's certified ID and proof of guardianship: a birth certificate, or a sworn affidavit or court order if the guardian isn't a parent. Sponsors can't untick them.
- The agreement states that the guardian assists with it, and the guardian co-signs.

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
| Which courses fit you best | Your field, APS, budget, province and preferred institutions | `src/utils/matching.ts` |
| Which deadlines you will miss at your current pace | Your task completion history | `src/intelligence/forecast.ts` |
| When you are most likely to act, so reminders land then | The hour and weekday of your past actions | `forecast.ts` |
| The month your money runs out | Your costs, funding and payment timing | `forecast.ts` |
| Which students a sponsor will prefer | That sponsor's past shortlist, offer and pass decisions | `src/intelligence/marketplace.ts` |
| When a fund will be used up | Award pace against budget and closing date | `marketplace.ts` |
| Scam and off-platform attempts | Message content: fee requests, contact and bank details | `src/intelligence/moderation.ts` |

The assistant (`src/intelligence/agent.ts`) acts on low-risk items itself, such as reminders and blocking scams, and asks first before anything that shares data or commits the student. It never accepts an offer for the student. Every alert has a **Why?** panel showing the evidence. These are explainable rules built on each user's own data, not machine learning.

## WhatsApp today and next

**Today** the bot shows *how* a student without data keeps up: a numbered menu with deadlines, offers, documents, the funding gap, a "when you'll need data" plan and scam reports. It runs on real phones through the Twilio WhatsApp Sandbox (`supabase/functions/whatsapp-twilio`).

- **Every reply comes from one fixed demo profile: Tatenda.** Deadlines are dated relative to today so it never goes stale, but it does not read anyone's account, so it does not change when you act in the app.
- **It is the same for every phone.** If you sign up as a new student (for example "Cat"), the bot still answers as Tatenda: new sign-ups are saved on your device only, and the bot does not know who is messaging.
- **Alerts are not sent to phones yet.** Linking a number and choosing alerts on the WhatsApp updates page happens in the in-app simulator, which plays the bot for your own account.

**Next**, so each student gets their own updates:

1. Real sign-up on the server, so every student's plan lives in the database.
2. Link the student's own number to their account with the 6-digit code (the tables and code hashing are already in `supabase/migrations/20261023120000_whatsapp.sql`).
3. The bot looks up whoever is messaging and answers from their own plan.
4. Alerts are pushed to the phone when a sponsor makes an offer, asks for a document or pays, using approved message templates.

A Meta WhatsApp Cloud API version (`supabase/functions/whatsapp-webhook`) is also built, and Meta has verified its webhook. It goes live once the business is verified with Meta.

## Testing

```bash
npm run typecheck    # TypeScript, strict
npm run build        # production build
npm run audit        # known vulnerabilities in dependencies
npm test             # 95 offline checks, no network or keys needed
npm run test:live    # 38 attack probes against the live backend (changes nothing)
```

- `npm test` runs the real Edge Functions under Node with Supabase, Twilio and Meta mocked: 63 server checks (signed-out actions, expired logins, bursary limits, guardian rules for under-18s, each account's reset touching only its own records, who may see marks and send warnings or tutor requests, a student posing as another student or a sponsor, forged profile fields, scam blocking, sponsor self-verification, a lost write race) and 32 webhook checks (bad, re-signed and tampered signatures, replays, rate limits, refused ID numbers and files, XML injection).
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
- The WhatsApp bot on real phones (Twilio sandbox), answering from a fixed demo profile
- University application, financial aid and residence links for all 26 public universities (checked 24 October 2026), all 50 public TVET colleges with their NSFAS accommodation portals (checked 23 October 2026), and the DHET Register of Private Higher Education Institutions (14 October 2026 update)
- The NSFAS 2026 accommodation rules used by "Check a place before you pay"
- Document type, readability and tamper checks; scam moderation; forecasts and sponsor learning
- Bursary terms, the two-bursary limit and the remaining-gap cap, checked on the server for every offer and acceptance
- The progress analysis (averages, APS from NSC levels, slips, pass marks), tutor requests and early warnings, with who may see and send what checked on the server

**Simulated, and labelled in the app**

- Identity, guardian and bank verification, payments to institutions, and institution confirmations
- Every sponsor, student and award in the marketplace
- Fees, APS guides and some deadlines in the Study Explorer
- Reading marks from a report: the demo proposes marks for the student to check before saving
- The Navigator chat, which uses scripted answers

**Not built yet**

- Real sign-up through Supabase Auth (new accounts are saved on the device), MFA and stronger password rules
- Personal WhatsApp updates: the bot answers as the demo student, and alerts reach the in-app simulator, not phones (see [WhatsApp today and next](#whatsapp-today-and-next))
- Private document storage on the server (documents stay on the device)
- Automated tests in CI, an audit log, and point-in-time backups

See the planned list in [SECURITY.md](SECURITY.md).
