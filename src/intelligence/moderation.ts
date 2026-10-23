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
    test: /\b(admin(istration)? fee|processing fee|application fee|registration fee to us|deposit|pay (us|me|a fee|r\s?\d+)|send (money|r\s?\d+|airtime|cash)|e-?wallet|cash send|voucher)\b/i,
  },
];

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
