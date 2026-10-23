# WhatsApp bot: setup

The bot runs as a Supabase Edge Function and answers from the same logic as
the in-app simulator (`supabase/functions/_shared/whatsapp/bot.ts`).
For the hackathon it runs in **demo mode**: the team's phones act as the demo
student, Tatenda, through Meta's free test number. It costs nothing, because
messages users send are free and replies stay within the monthly free tier.

## 1. Meta (about 15 minutes)

1. Go to developers.facebook.com, then **My Apps → Create app**. Choose a business app type and add the **WhatsApp** product.
2. Open **WhatsApp → API Setup**. Note down:
   - the **test phone number** and its **Phone Number ID**
   - the **temporary access token**. It expires after about a day; for anything longer, create a System User token in Business Settings.
3. On the same screen, add each team member's number under **To** (recipient numbers) and confirm the code WhatsApp sends.
4. **App settings → Basic → App secret**: copy it. This is used to verify that requests really come from Meta.
5. Check the Graph API version shown on the API Setup page (for example `v23.0`).

## 2. Deploy the function

```bash
supabase login
supabase link --project-ref <your-project-ref>

supabase secrets set \
  WHATSAPP_TOKEN=<access token> \
  WHATSAPP_APP_SECRET=<app secret> \
  WHATSAPP_VERIFY_TOKEN=<any long random string you choose> \
  WHATSAPP_PHONE_NUMBER_ID=<phone number id> \
  GRAPH_API_VERSION=<version from step 1.5> \
  DEMO_ALLOWED_NUMBERS=27821234567,27731234567 \
  APP_URL=https://<your-vercel-app>.vercel.app \
  BOT_MODE=demo

# Meta can't send a Supabase JWT, so JWT checks are off. The function checks
# Meta's HMAC signature on every POST instead.
supabase functions deploy whatsapp-webhook --no-verify-jwt
```

Never put these values in the frontend, `.env` files that get committed, or chat.

## 3. Connect the webhook

In **WhatsApp → Configuration → Webhook**, click Edit:

- **Callback URL:** `https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`
- **Verify token:** the same `WHATSAPP_VERIFY_TOKEN`

Then **subscribe to the `messages` field**.

## 4. Try it

From an allowlisted phone, send `hi` to the test number. You'll get the menu.
Then try `2` (deadlines), `3` (offers), `6` (when you need data), a photo
(refused), or a fake ID number (refused with a warning).

## Security built in

| Risk | Protection |
|---|---|
| Fake requests to the webhook | HMAC-SHA256 signature check with the app secret, constant-time compare (`meta.ts`) |
| Replayed or retried deliveries | Each message ID is answered once |
| Spam or cost abuse | 15 messages per 10 minutes per number; demo mode answers only allowlisted numbers |
| Sensitive data in chat | ID numbers, card numbers, OTPs and bank details are refused before processing; files and voice notes are refused |
| Account takeover through linking | 6-digit code from `crypto.getRandomValues`, valid 10 minutes, stored hashed, must be sent from the same number |
| Leaking data | The bot only knows a minimal snapshot (no surname, ID, documents or message contents); message text and numbers are never logged |
| Scams on WhatsApp | The bot never asks for money or documents and says so; `SCAM …` reports go to the safety team |

## Going live (after Supabase Auth)

1. `supabase db push` creates `whatsapp_links`, `whatsapp_link_codes`, `bot_snapshots` and `scam_reports`, all with RLS.
2. The app, signed in, writes the student's snapshot (`src/whatsapp/snapshot.ts`) to `bot_snapshots`. When linking, it stores the SHA-256 of the code in `whatsapp_link_codes`.
3. Set `BOT_MODE=live`.
4. Proactive alerts outside the 24-hour window need Meta-approved utility templates. These cost about R0.12 each in South Africa from 1 October 2026.
