import type { MessageFlag } from '../types';

/**
 * Message safety screen. Runs on every message before it is delivered.
 * - Contact details are removed so conversations stay on the platform
 *   (where they are logged, and a guardian can see them for under-18s).
 * - Requests for money from a sponsor are the most common bursary scam in
 *   South Africa; they are blocked and the sponsor is suspended for review.
 */

const RULES: { kind: MessageFlag['kind']; label: string; test: RegExp }[] = [
  {
    kind: 'contact-details',
    label: 'Phone number',
    test: /(\+27|\b0)[\s-]?[1-8]\d[\s-]?\d{3}[\s-]?\d{4}\b/,
  },
  {
    kind: 'contact-details',
    label: 'Email address',
    test: /[\w.+-]+@[\w-]+\.[\w.-]+/,
  },
  {
    kind: 'off-platform',
    label: 'Request to move off the platform',
    test: /\b(whats\s?app|telegram|call me|sms me|dm me|meet (me|up)|my number|your number|text me)\b/i,
  },
  {
    kind: 'bank-details',
    label: 'Bank or card details',
    test: /\b(account (no|number)|acc no|branch code|card number|cvv|pin\b|otp\b|banking password)/i,
  },
  {
    kind: 'payment-request',
    label: 'Request for payment',
    test: /\b(admin(istration)? fee|processing fee|application fee|registration fee to us|deposit|pay (us|me|a fee)|send (money|airtime|cash)|e-?wallet|cash send|voucher)\b/i,
  },
];

/** A rand amount: R500, R 1 500, R1,500.00 */
const AMOUNT = String.raw`\br\s?\d[\d\s,.]*`;

/** Paying the institution is how real bursaries work, so those sentences are fine. */
const TO_INSTITUTION = /\b(universit|institution|college|fee account|tuition|registrar|directly to)/i;

/**
 * Requests for money that the simple phrases above miss, for example
 * "send me R500", "R500 for the spot" or "send your documents and R500".
 * Checked sentence by sentence, so "we pay R60,000 to your university" is never flagged.
 */
function asksForMoney(text: string): boolean {
  return text.split(/[.!?\n]+/).some((sentence) => {
    if (TO_INSTITUTION.test(sentence)) return false;
    return (
      // send me R500, pay us R200, transfer me the money
      new RegExp(String.raw`\b(send|pay|transfer|eft|deposit|give|bring)\s+(me|us)\s+(${AMOUNT}|money|cash|airtime|the fee|a fee|the money)`, 'i').test(sentence) ||
      // R500 for the spot, R300 to secure your place, R1,000 to release the funds
      new RegExp(String.raw`${AMOUNT}\s*(for|to)\s+(the|a|your|my)?\s*(spot|place|slot|seat|position|form|admin|processing|application|registration|secure|reserve|release|unlock|hold|keep|book)`, 'i').test(sentence) ||
      // send your documents and R500, pay R500 today, transfer R300
      new RegExp(String.raw`\b(send|pay|transfer|eft|deposit|bring)\b[^.!?]{0,60}${AMOUNT}`, 'i').test(sentence)
    );
  });
}

export interface ScreenResult {
  flags: MessageFlag[];
  /** Blocked messages are never shown to the recipient. */
  blocked: boolean;
  /** Text after contact details are masked (for allowed messages). */
  cleanText: string;
  suspendSender: boolean;
}

export function screenMessage(text: string, from: 'student' | 'sponsor'): ScreenResult {
  const flags: MessageFlag[] = [];
  for (const r of RULES) {
    if (r.test.test(text) && !flags.some((f) => f.label === r.label)) flags.push({ kind: r.kind, label: r.label });
  }
  if (asksForMoney(text) && !flags.some((f) => f.kind === 'payment-request')) flags.push({ kind: 'payment-request', label: 'Request for payment' });
  const payment = flags.some((f) => f.kind === 'payment-request' || f.kind === 'bank-details');
  const blocked = payment && from === 'sponsor';
  let cleanText = text;
  cleanText = cleanText.replace(/(\+27|\b0)[\s-]?[1-8]\d[\s-]?\d{3}[\s-]?\d{4}\b/g, '[number removed]');
  cleanText = cleanText.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email removed]');
  return { flags, blocked, cleanText, suspendSender: blocked };
}

export const SAFETY_RULES = [
  'Real sponsors never ask you to pay a fee, deposit or “admin cost”.',
  'Funding is paid straight to your institution, never to you or a third party.',
  'Keep conversations in the app. Phone numbers and emails are removed automatically.',
  'Never share banking details, OTPs or passwords with anyone.',
];
