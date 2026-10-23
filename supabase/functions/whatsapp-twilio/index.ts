/**
 * WhatsApp bot through Twilio (Supabase Edge Function, Deno). Same bot logic
 * as the Meta webhook and the in-app simulator (_shared/whatsapp/bot.ts).
 *
 *   POST → Twilio "When a message comes in" webhook: verify Twilio's
 *          signature, answer with TwiML.
 *
 * Demo mode only: numbers in DEMO_ALLOWED_NUMBERS (or everyone when
 * DEMO_OPEN=true, for judges) chat with the fictional demo student.
 *
 * Secrets (supabase secrets set ...), never in client code:
 *   TWILIO_AUTH_TOKEN, DEMO_OPEN, DEMO_ALLOWED_NUMBERS, APP_URL
 *   TWILIO_WEBHOOK_URL (optional; the exact URL entered in Twilio, used for
 *   the signature. Defaults to this function's public URL.)
 */
import { handleMessage } from '../_shared/whatsapp/bot.ts';
import { createRateLimiter } from '../_shared/whatsapp/meta.ts';
import { parseTwilioForm, twiml, verifyTwilioSignature } from '../_shared/whatsapp/twilio.ts';
import { demoSnapshot } from '../_shared/whatsapp/demo.ts';

const env = (k: string) => Deno.env.get(k) ?? '';
const APP_URL = env('APP_URL') || 'https://thutovest.vercel.app';
const WEBHOOK_URL = env('TWILIO_WEBHOOK_URL') || `${env('SUPABASE_URL')}/functions/v1/whatsapp-twilio`;
const DEMO_OPEN = env('DEMO_OPEN') === 'true';
const allowed = (n: string) => DEMO_OPEN || env('DEMO_ALLOWED_NUMBERS').split(',').map((s) => s.replace(/\D/g, '')).filter(Boolean).includes(n);

const limit = createRateLimiter(15, 10 * 60_000); // 15 messages per 10 minutes per number
const seen = new Set<string>(); // Twilio retries on timeouts; answer each message once
const demoOptedOut = new Set<string>();

const xml = (body: string, status = 200) => new Response(body, { status, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
const nothing = () => xml(twiml([]));

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const raw = await req.text();
  if (raw.length > 20_000) return new Response('Too large', { status: 413 });
  const params = new URLSearchParams(raw);

  // Outcome logs carry no phone numbers or message text, only why the bot answered or stayed silent.
  if (!(await verifyTwilioSignature(WEBHOOK_URL, params, req.headers.get('x-twilio-signature'), env('TWILIO_AUTH_TOKEN')))) {
    console.log('twilio: bad signature', { hasHeader: Boolean(req.headers.get('x-twilio-signature')), hasToken: Boolean(env('TWILIO_AUTH_TOKEN')) });
    return new Response('Invalid signature', { status: 403 });
  }

  const msg = parseTwilioForm(params);
  if (!msg) {
    console.log('twilio: not a message');
    return nothing();
  }
  if (seen.has(msg.id)) return nothing();
  seen.add(msg.id);
  if (seen.size > 5000) seen.clear();
  if (!allowed(msg.from)) {
    console.log('twilio: number not allowed', { demoOpen: DEMO_OPEN });
    return nothing(); // stay silent for strangers
  }
  if (!limit(msg.from)) {
    console.log('twilio: rate limited');
    return nothing();
  }

  try {
    if (msg.hasMedia) {
      return xml(twiml([`For your safety, we can’t accept photos, documents or voice notes on WhatsApp. Upload documents in the app only: ${APP_URL}`]));
    }
    const result = handleMessage(msg.text, { now: new Date(), linked: true, optedOut: demoOptedOut.has(msg.from), snapshot: demoSnapshot(), appUrl: APP_URL });
    if (result.effect?.type === 'optOut') demoOptedOut.add(msg.from);
    if (result.effect?.type === 'optIn') demoOptedOut.delete(msg.from);
    console.log('twilio: replied', { messages: result.replies.length });
    return xml(twiml(result.replies));
  } catch (e) {
    // Never log message text or phone numbers.
    console.error('twilio handler failed', e instanceof Error ? e.message : 'unknown');
    return nothing();
  }
});
