# ThutoVest: hand-off for Claude Code

You are continuing work on **ThutoVest**, a web app built for the **FNB App of the Year Hackathon 2026**, challenge **Access to Higher Education**. Read this file fully, then `README.md`, `SECURITY.md` and `supabase/functions/whatsapp-webhook/README.md` before changing anything.

## 1. The product in one paragraph

ThutoVest helps South African matriculants get from "I want to study" to "I can graduate". It builds a personal plan, predicts what could go wrong, and connects students with **verified sponsors** who pay the **university directly**. The sponsor signs nothing outside the app, and documents never go by email. A WhatsApp companion lets students without data check updates; registration, signing and uploads stay in the app. Name meaning: "thuto" means learning or education in Setswana and Sesotho, and "vest" means investing in a student.

## 2. Hackathon rules and deadlines (Africa/Johannesburg time)

- Runs Fri 23 to Sun 25 Oct. **Final submission Mon 26 Oct, 23:59.** There are no live presentations; judges score only what is submitted.
- **Web apps must be hosted live and process user data in real time.** No static sites or mock-ups. Judges must be able to log in with demo accounts.
- The app existed before the hackathon, so **at least one feature must be built during the hackathon** and announced in the team-page updates.
- **Submission needs:** a slide deck (user journey story, technical architecture, demo link and logins), the Git repo link, a Lean Business Canvas and an SSDLC (security) write-up. A progress update goes on Sonke every night 23:00–00:00.
- **Other deadlines:** SSDLC **Sat 12:00**. 20-second "Hustle Pitch" video **Sat 13:30**. Lean Canvas **Sun 12:00**.
- **Judging:** seven criteria, 10 points each: Product, Creativity, Usability, Sustainability, Impact, Presentation and **Intelligence** ("can the app think for itself, forecast and predict the user's likely future behaviour by analysing patterns in data inputs?").

## 3. Stack and structure

- **Frontend:**
  - React 19, TypeScript (strict) and Vite, with Tailwind CSS v4 tokens in `src/index.css`.
  - React Router with HashRouter and lazy-loaded pages; icons from lucide-react v1.
- **Data:** at the moment the data layer is **browser-only**. The `DataStore` interface in `src/platform/dataStore.ts` uses localStorage, and the `storage` event syncs open tabs, so a sponsor tab and a student tab update each other live. The session lives in sessionStorage, one per tab. **This is the swap point for Supabase.**
- **Main folders:**
  - `src/pages`: student screens. `src/pages/sponsor`: sponsor screens.
  - `src/platform`: the shared marketplace state.
    - `platformReducer.ts`: every marketplace action.
    - `authorize.ts`: ownership checks and field whitelists for each action; port these to RLS.
    - `PlatformProvider.tsx`: runs every action through `authorize()`.
  - `src/state`: the student's own state (`studentReducer.ts`).
  - `src/intelligence`: the prediction logic.
    - `forecast.ts`: pace, activity rhythm, cash flow, scenarios.
    - `agent.ts`: the assistant's proposals.
    - `marketplace.ts`: sponsor preference learning, candidate ranking, fund depletion.
    - `moderation.ts`: message screening and scam blocking.
    - `documentCheck.ts`: document checks.
  - `src/whatsapp`: the in-app WhatsApp provider, simulator state and snapshot builder.
  - `supabase/functions/_shared/whatsapp/`: the bot logic (`bot.ts`), shared by the app and the server, plus `meta.ts` (signature checks, parsing, sending) and `demo.ts`.
  - `supabase/functions/whatsapp-webhook/`: the Edge Function. `supabase/migrations/`: the WhatsApp tables with RLS.
  - `vercel.json`: security headers (CSP, HSTS and others).
  - `src/config/brand.ts`: name, wordmark, demo domain, storage prefix and WhatsApp number (empty until live).

## 4. What already works

- **Student:**
  - onboarding (with an under-18 question) and a dashboard with the next best action
  - **Risk Radar**, which explains why each alert fired
  - **Funding Gap Solver**, covering NSFAS, ISFAP, Funza Lushaka, university aid and loans
  - **Adaptive Journey**, which re-plans when answers change
  - Study Explorer and a **Universities** page with official apply and financial aid links (checked 19 Oct 2026; DUT and UKZN apply via CAO)
  - **Forecast** page, scripted Student Navigator, Verification with trust levels 0–3 (guardian consent required for under-18s), and Profile
- **Documents:** a private vault with automatic checks (type, readability, profile match and tamper detection). Files are checked by their actual contents (signature bytes, not the name) and limited to 8 MB, and ID copies are never stored as an image. Students share documents with a sponsor in one tap, and the sponsor can ask for a new copy.
- **Sponsor:**
  - overview with assistant insights
  - ranked candidates that learn from the sponsor's decisions
  - funds with a forecast of when each runs out
  - offers that list required documents (an admission letter is always required)
  - a pipeline with document review, approve funding and pay (only possible once funding is approved)
  - messages, organisation checks (registration, representative, bank) and a join flow
- **Marketplace flow:**
  1. The sponsor makes an offer.
  2. The student signs the agreement in the app, with a guardian co-signing for under-18s.
  3. The student shares the required documents.
  4. The sponsor approves each document.
  5. The sponsor approves funding.
  6. The money is paid **to the institution only**.
  7. The sponsor asks for semester results.
- **Safety:** messages containing contact or payment details are screened; asking for money blocks the message and suspends the sponsor (QuickBursary SA is the seeded scam example). The bot refuses ID numbers, OTPs, bank details and files.
- **WhatsApp (built today, hackathon feature):** the `/app/whatsapp` page.
  - **Linking:** consent plus a 6-digit code that expires after 10 minutes.
  - **Chat:** a simulator with a numbered menu covering what's new, deadlines, offers, documents, funding gap, when you'll need data and scam reports.
  - **Alerts:** live alerts for offers, document requests, approvals, payments, messages and deadlines 3 days away, which students can choose to switch on or off.
  - **Data plan:** a "when you'll need data" plan with MB estimates and a "get data by" day.
  - **Real webhook:** written and tested in demo mode, using Tatenda's data for allowlisted test numbers. **Not deployed yet.**
- **Residences and colleges (built 23 Oct, hackathon feature):** real data only, sources and check dates in each data file.
  - `/app/institutions` now has three tabs: Universities (plus each official residence page), all **50 public TVET colleges** (each website opened and confirmed, plus its NSFAS accommodation portal), and **Check a private college**.
  - The private college check searches a snapshot of the official **DHET Register of Private Higher Education Institutions** (last update 14 Oct 2026, 172 entries: registered, provisional, cancelled) in `src/data/privateRegister.ts`. It explains that SAQA does not accredit colleges: DHET registers them, CHE, Umalusi and QCTO accredit qualifications. Registration numbers are only shown where the PDF match was unambiguous.
  - `/app/residences`: residence links for the student's starred institutions, a **"Check a place before you pay"** tool (`src/intelligence/accommodationCheck.ts`) that applies the NSFAS 2026 accommodation rules with clause numbers and flags scam signs, and "Use this in my plan", which updates the funding gap and forecast live. Also an NSFAS accommodation portal finder for every public university and TVET college.
  - No NSFAS cap amounts are shown: no official 2026 figure could be confirmed.
- **Supabase backend (live since 23 Oct, project ref `kzptyubhytyqwdqznodj`):** see SECURITY.md "Supabase backend". Migrations pushed, `platform` function deployed, demo logins work against it, and two tabs sync through the server in about 2 seconds. `.env.local` holds only the public URL and anon key. The hosted site (Vercel) still needs the same two values.
  - `supabase/functions/platform`: server-side authorize + reducer (bundled from `src/server/core.ts` by `npm run build:server`; rebuild and commit `supabase/functions/_shared/platform-core.js` after changing marketplace rules).
  - Migration `20261023150000_platform.sql`: `profiles`, `platform_state`, `platform_ticks`, `student_states`, RLS, the two demo users.
  - App: `src/platform/backend.ts`; `PlatformProvider` and `StudentProvider` switch to the server when a tab signs in with a real account (`session.backend`), otherwise browser-only as before. Students publish an anonymised profile (`publishCandidate`) so sponsors on other devices can find them.
  - Go live: `npx supabase@latest db push`, `npx supabase@latest functions deploy platform --use-api`, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` and on Vercel.
- **Tests that passed in the cloud session:**
  - 17 authorization rule tests
  - 37 bot and signature tests
  - 10 webhook tests (the real function against a mocked Graph API)
  - Playwright flows for the full two-tab funding journey and the WhatsApp page; no console errors, no overflow at 390 px wide

## 5. Demo accounts (on slides; keep them working)

| Role | Email | Password |
|---|---|---|
| Student (Tatenda, Grade 12, 17, guardian Nomsa) | `tatenda@thutovest.demo` | `Demo#2026` |
| Sponsor (Ridgeline Technologies) | `funding@ridgeline.demo` | `Demo#2026` |

## 6. Design rules (a design audit already enforced these)

- **Identity:** navy (`ink`), veld green (`veld`), paper backgrounds. Bricolage Grotesque for headings and Public Sans for body text. The **route motif** (two nodes joined by a line) is used via `RouteMark` and `.route-bullet` instead of sparkles or icon tiles.
- **Never add:**
  - gradients, glass or blur effects, or badges above headlines
  - rows of icon boxes, coloured-border cards, or emojis in UI or bot text
  - **em dashes in copy**, or buzzwords
- **Text style:** sentence-case buttons ("Build my plan"). Copy must be specific and honest; demo data is always labelled.
- **Copy limits (copy diet, 23 Oct):** users are teenagers skimming on phones.
  - Page header descriptions: 12 words or fewer. Card body text: 15 words or fewer, leading with the number or status ("R92,400 still unfunded", "6 days left"). Buttons: 1 to 3 words.
  - Explanations (Risk Radar reasons, forecasts, assistant evidence, sponsor ranking, study-option fit, funding eligibility) go behind a closed "Why?" toggle: `src/components/ui/Why.tsx`. Never delete them; they carry the Intelligence score.
  - Background for judges (honesty note, business model, trust principles) lives on `/about`, linked from the footer.
- **Spacing:** Tailwind scale 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24. Half steps only for text and icon nudges.
- **Contrast:** at least 4.5:1 for text (`subtle` #5f6a85 and `ink-400` #5a6994 were adjusted for this).
- **Layout:** mobile first; check at 390 px wide with no horizontal scroll.

## 7. Security rules (see SECURITY.md)

- **Never ask me to paste secrets into chat.** I type tokens into `supabase secrets set` or the Vercel dashboard myself. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` may reach the browser; the service_role key never goes in a `VITE_` variable.
- **Every table gets RLS.** Port `src/platform/authorize.ts` rule by rule:
  - Students act only on their own applications.
  - Sponsors act only on their own funds, applications and document shares.
  - Ownership, status, verification and dates are set by the server, never by the client.
  - Grant column updates only for fields a user may change.
- **Server-only actions:** offer, accept, approve and pay run in Edge Functions or `security definer` RPCs, not direct table updates.
- **Documents:** a private Storage bucket and short-lived signed URLs. Run the signature-byte file check again on the server.
- **Before submitting:** run `npm run audit`.

## 8. Known limitations (be honest about these in the deck)

- **Backend:** none yet; data is per browser.
- **Simulated:** verification, payments and institution confirmations.
- **Forecasts:** explainable rules from the student's own history, not machine learning. The Navigator is scripted.
- **WhatsApp:** live mode needs Supabase Auth. Alerts sent outside the 24-hour window need Meta utility templates, about R0.12 each in South Africa from 1 Oct 2026; replies are within a free 1,000 per month.

## 9. What to do next, in order

0. **Verify locally:** `npm install`, `npm run build`, `npm run audit`. Fix anything that fails. The cloud session could only build with a stand-in toolchain.
1. **WhatsApp on a real phone (demo mode):**
   - Link the Supabase project.
   - I set the secrets myself.
   - Deploy `whatsapp-webhook` with `--no-verify-jwt`.
   - Connect the webhook in Meta (subscribe to `messages`) and test "hi" from my phone.
2. **Supabase backend:**
   - Supabase Auth with the two demo users seeded.
   - Tables for students, sponsors, funds, applications, document shares, messages and events.
   - RLS ported from `authorize.ts`.
   - Realtime subscriptions behind the existing `DataStore` interface, so the rest of the app barely changes.
   - Storage for documents.
3. **Deploy to Vercel:** keep `vercel.json` headers, set `APP_URL`, and check that the CSP allows the Supabase URL. Then switch the bot to `BOT_MODE=live` and have the app write `bot_snapshots` and hashed link codes.
4. **Hackathon feature: the dropout early warning.** Use semester results to flag failed modules or a falling average, suggest tutoring or a mentor, and alert the sponsor before the next payment, with a "continuation risk" score.
5. **Intelligence made visible:** a "What I've learned about you" panel that shows predictions, then whether they came true, with a running accuracy count. Also show the sponsor ranking changing after each decision.
6. **Sponsor Impact and B-BBEE report:** amount spent, students funded, demographics and pass rates, as a downloadable summary. This is the subscription revenue story.
7. **Cohort model:** a clearly labelled synthetic history of about 2,000 past students with outcomes, and a simple model trained on it in the app ("students with your pattern missed the NSFAS deadline 38% of the time"), with reasons shown.
8. **Reach:** one more language (isiZulu or Setswana) on key screens, and a low-data mode.
9. **Impact evidence:** real South African figures, with sources, for first-year dropout, the "missing middle" funding gap and bursary scams, on the landing page and in the deck.

## 10. How to work with me

- Keep the demo logins and the seeded demo journey working after every change.
- Run the type check and build after each change, and test at mobile width.
- Tell me before anything destructive or hard to undo.
- Keep demo or simulated data clearly labelled; never fake "verified" claims.
- After each milestone, give me one line I can paste into the 23:00 Sonke progress update.
