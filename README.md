# ThutoVest

**From “I want to study” to “I can graduate.”**

A two-sided student-funding platform for the FNB App of the Year Hackathon 2026 (Access to Higher Education).

- **Students** get an adaptive study plan, forecasts built from their own behaviour, and an assistant that prepares work for them.
- **Sponsors** (companies, trusts, NPOs) publish funds and get a ranked shortlist of verified students. They pay awards **straight to the institution**.
- **Both sides are verified**, messages are screened for scams, and under-18s need guardian consent.

> Prototype notice: sponsors, students, fees, deadlines and verification checks are demonstration data or simulations, and the UI labels them. No ID numbers, photos or bank details are collected.

The product name lives in one file, `src/config/brand.ts` (plus the `<title>` and meta tags in `index.html`), so renaming takes a minute.

## Run it

Requires **Node.js 20.19+ or 22.12+**.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
```

### Deploy (free)

The app uses hash routing, so `dist/` works on any static host.

- **Vercel:** import the repo. Build command `npm run build`, output `dist`.
- **Firebase Hosting:** `firebase init hosting` (public dir `dist`, single-page app *No*), then `firebase deploy`.

## Demo accounts (for judges)

| Role | Email | Password |
| --- | --- | --- |
| Student (Tatenda, Grade 12, 17 years old) | `tatenda@thutovest.demo` | `Demo#2026` |
| Sponsor (Ridgeline Technologies) | `funding@ridgeline.demo` | `Demo#2026` |

The sign-in page also has one-click demo buttons.

**Real-time demo:** open the student and the sponsor in two tabs side by side. Offers, payments, messages and safety blocks appear in the other tab instantly.

## Demo script (about three minutes)

Everything happens inside the app. No email, no WhatsApp and no outside forms.

1. **Student tab:** sign in as Tatenda. The assistant shows a Ridgeline bursary match. Approve **Share my profile**.
2. **Sponsor tab:** sign in as Ridgeline.
   - Go to **Offers & payments**, then **Review documents** on Ayesha (seeded). Payment is locked until every required document is approved.
   - Go to **Candidates**, then Tatenda, then **Make offer**. The admission letter is always required; tick any extra documents you want.
3. **Student tab:** the offer arrives live. Open **Sponsors**, then **Review, sign and accept**.
   - Read the funding agreement, type your full name and tick the box to agree.
   - Tatenda is 17, so her guardian Nomsa also co-signs on the same device.
4. **Student tab:** open **Documents**. Each requested document shows **Upload and share**.
   - Tick "simulate an edited document" and add a file. The forgery is caught, and the file can't be saved or shared.
   - Upload again: use a sample file, or take a photo. The automatic check reads the document, matches it to the profile and flags notes (for example "provisional offer").
   - **Share** it in one tap. The assistant also offers to share documents that are already in the vault.
5. **Sponsor tab:** review the shared documents.
   - Ask for a new copy of the admission letter, with a note. This shows up on the student's Risk Radar and assistant.
   - **Confirm with the institution**, then approve the documents.
   - **Approve funding**, then **Pay institution**.
6. **Student tab:** the award timeline goes Offer, Signed, Documents 3/3, Approved, Paid. Confirming the admission letter also raised Tatenda's verification level.
7. **Sponsor tab:** on the paid award, use **Request another document** to ask for **semester results**. This is how the sponsor tracks impact.
8. **Safety:**
   - Send "WhatsApp me on 082 123 4567" as Tatenda. The number is removed.
   - Send "pay a R500 admin fee" as the sponsor. The message is blocked and the sponsor is suspended.

Use **Reset demo** (student sidebar) to start again.

## Documents and approval (all in the app)

- **Vault:** students upload once (PDF or a phone photo) and keep everything in a private vault. Nothing leaves it until they choose to share.
- **Automatic document check:** each upload is checked for:
  - file type and readability
  - whether it's the right document (detected from the file)
  - whether the name and institution match the student's profile
  - how recent it is
  - signs of editing

  The results go with the document, so sponsors review faster.
- **Issuer confirmation:** admission letters and results can be confirmed with the institution or school (simulated). A confirmed admission letter verifies the student's enrolment and raises their trust level.
- **Sponsor requests:**
  - Every offer requires an admission letter, and sponsors can add results, income proof, ID or a motivation letter.
  - Sponsors can ask for a new copy (with a note), send in-app reminders and request more documents later, such as semester results.
- **Funding agreement:** students sign it in the app with their typed full name. Under-18s need a guardian co-signature on the same device.
- **Payment gate:** sponsors can't pay until every required document is approved. Payment then goes only to the institution.
- **Transparency:** "Who has your documents" lists every share. Sponsors only receive a copy taken at the moment of sharing, for that award.

## Universities (official links)

- The **Universities** page (`/app/institutions`) lists all 13 institutions. Each one links to its official application page, its financial aid or bursary page and its website. DUT and UKZN also link to the CAO.
- You can search the list, filter it by province and type, and star up to three institutions as your preferences. Each card links to that institution's options in the Study Explorer (`?institution=id`).
- The same links also show up in the study-option detail, the Journey's "Apply" stage, the Funding page's institutional aid card and the Navigator's answers about applying.
- All links live in `src/data/institutions.ts`. They were checked on 19 October 2026 (`LINKS_CHECKED_ON`), so re-check them before the demo.

## TVET colleges, private colleges and residences

- **TVET colleges** (`/app/institutions?tab=tvet`): all 50 public TVET colleges with their own websites (checked 23 October 2026) and the NSFAS accommodation portal for each.
- **Check a private college** (`?tab=private`): searches the official DHET Register of Private Higher Education Institutions (last update 14 October 2026). Shows registered, provisionally registered or registration cancelled, and explains who does what: DHET registers colleges, CHE, Umalusi and QCTO accredit qualifications, and SAQA records qualifications on the NQF.
- **Residences** (`/app/residences`): official residence pages, NSFAS's 2026 accommodation rules with clause numbers, an NSFAS portal finder, and "Check a place before you pay", which flags scam signs and NSFAS problems and can put the cost straight into the student's plan.

## WhatsApp updates (low-data companion)

- **Page:** `/app/whatsapp` (WhatsApp updates in the sidebar). Students link a South African cellphone number with a 6-digit code that expires in 10 minutes, after giving consent.
- **What the bot does:**
  - Answers a numbered menu: what's new, deadlines, offers, documents needed, funding gap, when you'll need data, and scam reports.
  - Sends alerts when an offer, document request, approval, payment, new message or 3-day deadline happens.
- **The data plan:** every "do this in the app" step says roughly how many MB it needs. Reply 6 to get a total and a "buy data by" day, timed to when the student usually acts.
- **What stays in the app:** registration, signing and uploads. The bot refuses files, ID numbers, OTPs and bank details, and never asks for money.
- **Shared logic:** `supabase/functions/_shared/whatsapp/bot.ts` drives both the in-app simulator and the real bot.
- **Real bot:** `supabase/functions/whatsapp-webhook` (see its README). It works with Meta's free test number in demo mode.
- **Demo script:**
  1. Open WhatsApp updates, enter any 08x number, tick consent, and press **Get my link code**, then **Send it in the simulator**.
  2. Reply 3 and 6.
  3. In another tab, as the sponsor, send Tatenda an offer. The alert arrives in the chat live.

## How the app "thinks" (Intelligence criterion)

| What it predicts | Data it learns from | File |
| --- | --- | --- |
| Which deadlines you'll miss at your current pace, and the pace you need | Your task-completion history (timestamps) | `src/intelligence/forecast.ts` (`forecastPace`) |
| When you're most likely to act, so reminders land then | Hour and weekday of your past actions | `activityRhythm` |
| Which month money runs out | Your costs, funding sources and typical payment timing | `forecastCashFlow` |
| Funding if pending applications succeed | Application statuses and offers | `fundingScenarios` |
| Which students a sponsor will prefer | The sponsor's past shortlist, offer and pass decisions | `src/intelligence/marketplace.ts` (`learnPreferences`, `rankCandidates`) |
| When a fund will be used up | Recent award pace vs budget and closing date | `forecastFund` |
| Scam and off-platform attempts | Message content (payment requests, contact details, bank details) | `src/intelligence/moderation.ts` |

**The assistant** (`src/intelligence/agent.ts`) turns these into actions:
- **Done automatically:** low-risk actions such as reminders, re-prioritising and blocking scams.
- **Needs approval:** anything that shares data or commits the student, such as pre-filled applications and sharing a profile with a sponsor.

The assistant never accepts an offer for the student. Every item has a "Why?" panel listing the data it used.

## Architecture

```
src/
  config/brand.ts            product name in one place
  platform/                  DataStore interface (localStorage + cross-tab realtime),
                             PlatformProvider (marketplace + per-tab session), reducer
  state/                     student state, reducer, provider (also realtime-synced)
  intelligence/              forecasts, agent, marketplace matching & learning,
                             sponsor insights, message moderation
  utils/                     engine (risk radar, journey, next action), funding, trust
  data/                      demo marketplace seed, study options, funding, journey tasks
  pages/                     student screens; pages/sponsor/ sponsor screens
  components/                ui kit, layout shells, agent, verification, marketplace, charts
```

**Going live:** `src/platform/dataStore.ts` defines a three-method interface (`load`, `save`, `subscribe`). Implement it with Supabase (a table plus a realtime channel) or Firebase (Firestore documents plus `onSnapshot`), and nothing else changes. This is a good feature to build during the hackathon weekend.

## Security & trust (for the SSDLC form)

- **Identity:**
  - Students: document check, face match, liveness, then a Home Affairs match through an accredited provider (simulated here).
  - Sponsors: CIPC, NPO or Master's Office registration, plus a check on the representative's ID and the bank account owner.
  - Registration number formats are validated.
- **Trust levels** are computed from the checks, never self-declared. Sponsors only see students at "ID verified" or above who have opted in to discovery.
- **Minors:** under-18s need recorded guardian consent before contact. Guardians can see the conversations.
- **Money flow:** awards are paid only to institution fee accounts, so no money passes through students or the platform's users.
- **Messaging:**
  - Phone numbers and emails are removed automatically.
  - Requests for payment or bank details are blocked, and the sender is suspended pending review.
- **Data minimisation (POPIA):** consent-first. Sponsors see first name, province, field, gap and verification badges only. Checks keep results, not documents.
- **Frontend:** strict TypeScript; no `dangerouslySetInnerHTML` in app code; all user text is rendered as text.
- **Authorization:** every platform action passes `src/platform/authorize.ts`, which checks ownership and whitelists the fields a user may set.
- **Uploads:** checked by size and by the file's own signature bytes, not its name. ID copies are never kept as an image.
- **Headers:** CSP, HSTS and frame-blocking are set in `vercel.json`.
- **Full audit:** the 20-point checklist, and what must move to the backend, is in [SECURITY.md](SECURITY.md).

## Lean canvas (summary)

- **Problem:** students can't see their full funding gap, miss deadlines and fall for bursary scams. Sponsors can't find verified, deserving students or track impact.
- **Solution:** an adaptive plan with forecasts, plus a verified two-sided funding marketplace that pays institutions directly.
- **Unique value:** the only place where a verified sponsor's award closes a specific, explained student gap. An assistant predicts problems before they happen.
- **Customers:** Grade 11–12 learners, gap-year applicants, first-year students; companies (skills-development spend), trusts and NPOs; institutions.
- **Channels:** schools and life-orientation teachers, university financial-aid offices, corporate CSI teams, social media.
- **Revenue:**
  - Small administration fee on awards paid through the platform.
  - Sponsor reporting tier (impact and skills-development reports).
  - Institution and school cohort-insights subscriptions.
  - Free for students.
- **Costs:** verification provider per check, hosting, payments rail, support and moderation.
- **Key metrics:** students verified, rand awarded through the platform, gap closed per student, on-time application rate, sponsor retention.
- **Unfair advantage:** behavioural data on student progress plus verified outcomes, which make matching better for both sides over time.

## Limitations

- No real backend yet. Data lives in the browser and syncs between tabs on the same device.
- Verification checks, payments and institution confirmations are simulated. Document checks use rules on the file plus profile data (no OCR yet). Photos are kept as small previews to fit browser storage.
- Forecasts use simple, explainable models (pace, frequency, cash timing), not machine learning. Sponsor ranking learns from that sponsor's decisions only.
- The Navigator uses scripted answers, not a live AI model.
- University links point to the official sites, but fees, APS guides and qualifications in the Study Explorer are demonstration figures.
