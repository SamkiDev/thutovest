/**
 * ThutoVest WhatsApp companion: the conversation logic.
 *
 * Pure TypeScript with no imports, so the same file runs in the browser
 * (the in-app simulator) and in the Supabase Edge Function (the real bot).
 *
 * Design rules
 * - WhatsApp is read-and-remind only. Registration, signing, uploads and
 *   anything sensitive happen in the app over HTTPS.
 * - The bot never accepts files, ID numbers, OTPs, passwords or bank details,
 *   and never asks for money. If a student sends one, it refuses and warns.
 * - Replies are short, numbered and text-only to keep data use tiny.
 * - Every "do this in the app" step says roughly how much data it will use,
 *   so a student can decide when to buy data.
 */

/* ---------------- Snapshot: everything the bot may know ---------------- */

export interface BotDeadline {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  daysLeft: number;
  status: 'todo' | 'in-progress';
  /** Where the step is done, which decides the data estimate. */
  where: 'app' | 'university-site' | 'offline';
}

export interface BotOffer {
  id: string;
  sponsor: string;
  fund: string;
  amount: number;
  status: 'offered' | 'accepted' | 'approved' | 'paid';
  institution?: string;
  docsApproved: number;
  docsRequired: number;
  paymentReference?: string;
}

export interface BotDocumentRequest {
  id: string;
  label: string;
  sponsor: string;
  status: 'requested' | 'resubmit' | 'shared' | 'approved';
  dueInDays?: number;
}

export interface BotUpdate {
  id: string;
  at: string;
  text: string;
}

export interface BotSnapshot {
  studentId: string;
  firstName: string;
  generatedAt: string;
  /** When this student usually acts, learned from their history, e.g. "weekday evenings". */
  activeTime?: string;
  deadlines: BotDeadline[];
  offers: BotOffer[];
  documents: BotDocumentRequest[];
  funding: { totalCost: number; identified: number; gap: number };
  sponsorMessages: number;
  updates: BotUpdate[];
}

export interface BotContext {
  now: Date;
  linked: boolean;
  optedOut: boolean;
  snapshot?: BotSnapshot;
  /** Pending link code, only known to the server (or the simulator). */
  pendingCode?: { code: string; expiresAt: string };
  appUrl: string;
}

export type BotEffect =
  | { type: 'link' }
  | { type: 'optOut' }
  | { type: 'optIn' }
  | { type: 'reportScam'; text: string };

export interface BotResult {
  replies: string[];
  effect?: BotEffect;
}

/* ---------------- Data estimates (rounded up, honest "about") ---------------- */

export const DATA_MB = {
  signOffer: 2,
  uploadPhoto: 3,
  uploadPdf: 1,
  readMessages: 1,
  appStep: 2,
  universitySite: 15,
} as const;

const deadlineMb = (d: BotDeadline) =>
  d.where === 'university-site' ? DATA_MB.universitySite : d.where === 'app' ? (/upload/i.test(d.title) ? DATA_MB.uploadPhoto : DATA_MB.appStep) : 0;

/* ---------------- Formatting ---------------- */

export function rand(n: number): string {
  const s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${n < 0 ? '-' : ''}R${s}`;
}

const days = (n: number) => (n < 0 ? `${-n} day${n === -1 ? '' : 's'} overdue` : n === 0 ? 'due today' : n === 1 ? 'due tomorrow' : `${n} days left`);
const MAX_LINES = 6;

/* ---------------- Phone numbers ---------------- */

/** South African mobile numbers only, normalised to +27XXXXXXXXX. */
export function normaliseSaMobile(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, '');
  const m = /^(?:\+?27|0)([6-8]\d{8})$/.exec(digits);
  return m ? `+27${m[1]}` : null;
}

export function maskPhone(e164: string): string {
  return `${e164.slice(0, 3)} •• ••• ${e164.slice(-4)}`;
}

/* ---------------- Safety screen ---------------- */

const SENSITIVE: { test: RegExp; what: string }[] = [
  { test: /\b\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{4}[01]\d{2}\b/, what: 'an ID number' },
  { test: /\b(?:\d[ -]?){13,19}\b/, what: 'a card or account number' },
  { test: /\b(otp|one[- ]time pin|pin\b|password|cvv|banking details|account number|branch code)/i, what: 'a PIN, OTP, password or bank details' },
];

export function screenInbound(text: string): string | null {
  for (const s of SENSITIVE) if (s.test.test(text)) return s.what;
  return null;
}

const SAFETY_LINE = 'ThutoVest will never ask for money, OTPs, PINs, passwords, bank details or documents on WhatsApp.';

/* ---------------- Menu ---------------- */

export function menu(name?: string): string {
  return [
    `*ThutoVest updates${name ? ` for ${name}` : ''}*`,
    'Reply with a number:',
    '1. What’s new',
    '2. My deadlines',
    '3. My offers',
    '4. Documents I still need',
    '5. My funding gap',
    '6. When do I need data?',
    '7. Report a scam',
    '0. Stop updates',
  ].join('\n');
}

/* ---------------- Answers ---------------- */

function whatsNew(s: BotSnapshot): string {
  if (!s.updates.length) return 'No new updates. I’ll message you when something changes.';
  const lines = s.updates.slice(0, 5).map((u) => `• ${u.text}`);
  if (s.sponsorMessages > 0) lines.push(`• ${s.sponsorMessages} sponsor message${s.sponsorMessages === 1 ? '' : 's'} to read in the app (about ${DATA_MB.readMessages} MB)`);
  return ['*What’s new*', ...lines].join('\n');
}

function deadlines(s: BotSnapshot): string {
  const open = [...s.deadlines].sort((a, b) => a.daysLeft - b.daysLeft);
  if (!open.length) return 'You have no open deadlines. Nice work.';
  const lines = open.slice(0, MAX_LINES).map((d) => {
    const mb = deadlineMb(d);
    return `• ${d.title}: *${days(d.daysLeft)}*${mb ? ` (needs data, about ${mb} MB)` : ''}`;
  });
  if (open.length > MAX_LINES) lines.push(`…and ${open.length - MAX_LINES} more in the app.`);
  return ['*Your deadlines*', ...lines].join('\n');
}

function offers(s: BotSnapshot, appUrl: string): string {
  if (!s.offers.length) return 'No sponsor offers yet. Keep your profile verified and discoverable in the app so sponsors can find you.';
  const lines = s.offers.map((o) => {
    const head = `• ${o.sponsor}, ${o.fund}: *${rand(o.amount)}*`;
    switch (o.status) {
      case 'offered':
        return `${head}\n  Offer waiting. Sign it in the app (about ${DATA_MB.signOffer} MB): ${appUrl}`;
      case 'accepted':
        return `${head}\n  Signed. Documents approved: ${o.docsApproved} of ${o.docsRequired}.`;
      case 'approved':
        return `${head}\n  Approved. Payment to ${o.institution ?? 'your institution'} is being scheduled.`;
      case 'paid':
        return `${head}\n  Paid to ${o.institution ?? 'your institution'}${o.paymentReference ? `, ref ${o.paymentReference}` : ''}.`;
    }
  });
  return ['*Your offers*', ...lines, '', 'Money is only ever paid to your institution, never to you or anyone else.'].join('\n');
}

function documents(s: BotSnapshot, appUrl: string): string {
  const open = s.documents.filter((d) => d.status === 'requested' || d.status === 'resubmit');
  if (!open.length) return 'No documents needed right now.';
  const lines = open.map(
    (d) => `• ${d.label} for ${d.sponsor}${d.status === 'resubmit' ? ' (*new copy needed*)' : ''}${d.dueInDays != null ? `, ${days(d.dueInDays)}` : ''}`,
  );
  return [
    '*Documents to upload*',
    ...lines,
    '',
    `Upload them in the app only, about ${DATA_MB.uploadPhoto} MB per photo or ${DATA_MB.uploadPdf} MB per PDF: ${appUrl}`,
    'Please don’t send documents here. WhatsApp uploads aren’t checked or protected.',
  ].join('\n');
}

function funding(s: BotSnapshot): string {
  const f = s.funding;
  if (f.gap <= 0) return `*Funding*\nYour costs of ${rand(f.totalCost)} are covered by the ${rand(f.identified)} you’ve identified.`;
  return [
    '*Funding*',
    `Estimated costs: ${rand(f.totalCost)}`,
    `Funding identified: ${rand(f.identified)}`,
    `Still unfunded: *${rand(f.gap)}*`,
    '',
    'Reply 3 to see your offers.',
  ].join('\n');
}

export interface DataPlan {
  items: { label: string; mb: number; daysLeft?: number }[];
  totalMb: number;
  buyBy?: number; // days from now
}

/** What needs data in the next 7 days, how much, and by when to have it. */
export function dataPlan(s: BotSnapshot): DataPlan {
  const items: DataPlan['items'] = [];
  for (const o of s.offers) if (o.status === 'offered') items.push({ label: `Sign the ${o.sponsor} offer`, mb: DATA_MB.signOffer });
  for (const d of s.documents) if (d.status === 'requested' || d.status === 'resubmit') items.push({ label: `Upload ${d.label.toLowerCase()}`, mb: DATA_MB.uploadPhoto, daysLeft: d.dueInDays });
  // A journey step and a sponsor request can be the same upload: count it once.
  const requested = s.documents.filter((d) => d.status === 'requested' || d.status === 'resubmit').map((d) => d.label.toLowerCase());
  for (const d of s.deadlines) {
    const mb = deadlineMb(d);
    const duplicate = d.where === 'app' && requested.some((label) => d.title.toLowerCase().includes(label));
    if (mb && d.daysLeft <= 7 && !duplicate) items.push({ label: d.title, mb, daysLeft: d.daysLeft });
  }
  if (s.sponsorMessages > 0) items.push({ label: 'Read sponsor messages', mb: DATA_MB.readMessages });
  const totalMb = items.reduce((t, i) => t + i.mb, 0);
  const dated = items.map((i) => i.daysLeft).filter((d): d is number => d != null);
  const earliest = dated.length ? Math.min(...dated) : undefined;
  return { items, totalMb, buyBy: earliest != null ? Math.max(0, earliest - 1) : items.length ? 2 : undefined };
}

function dataAnswer(s: BotSnapshot): string {
  const p = dataPlan(s);
  if (!p.items.length) return 'Nothing in the next 7 days needs data. You can keep checking here.';
  const lines = p.items.slice(0, MAX_LINES).map((i) => `• ${i.label}: about ${i.mb} MB${i.daysLeft != null ? ` (${days(i.daysLeft)})` : ''}`);
  const when = p.buyBy === 0 ? 'today' : p.buyBy === 1 ? 'by tomorrow' : `within ${p.buyBy} days`;
  return [
    '*When you need data*',
    ...lines,
    '',
    `Total: about *${p.totalMb} MB*. Get data ${when}${s.activeTime ? `, ideally before your usual ${s.activeTime}` : ''}, and do them in one session.`,
  ].join('\n');
}

const SCAM_HELP = [
  '*Report a scam*',
  'Send the suspicious message starting with the word SCAM, for example:',
  'SCAM Someone says I must pay R500 to receive a bursary',
  '',
  'Don’t pay, don’t send documents and don’t share OTPs. Real sponsors on ThutoVest never ask for money.',
].join('\n');

/* ---------------- The conversation ---------------- */

export function handleMessage(raw: string, ctx: BotContext): BotResult {
  const text = raw.trim().slice(0, 500);
  const word = text.toLowerCase();

  // 1. Safety first, before anything is processed or stored.
  const sensitive = screenInbound(text);
  if (sensitive) {
    return {
      replies: [`*Stop:* please don’t send ${sensitive} here, and delete the message. ${SAFETY_LINE}\nIf someone asked you for this, reply 7 to report it.`],
    };
  }

  // 2. Opt-out works whether or not the number is linked.
  if (/^(0|stop|unsubscribe|opt out)$/.test(word)) {
    return { replies: ['Updates are off. You won’t get any more messages. Send START to turn them back on.'], effect: { type: 'optOut' } };
  }
  if (word === 'start') {
    if (!ctx.linked) return { replies: [notLinked(ctx.appUrl)] };
    return { replies: ['Updates are back on.', menu(ctx.snapshot?.firstName)], effect: { type: 'optIn' } };
  }

  // 3. Linking: the code is created in the app, after sign-in, and expires.
  const link = /^link\s*(\d{6})$/i.exec(text);
  if (link) {
    if (ctx.linked) return { replies: ['This number is already linked. Reply MENU to see options.'] };
    const p = ctx.pendingCode;
    if (!p || p.code !== link[1]) return { replies: ['That code doesn’t match. Open WhatsApp updates in the app to get a new code.'] };
    if (new Date(p.expiresAt).getTime() < ctx.now.getTime()) return { replies: ['That code has expired. Get a new one in the app. Codes last 10 minutes.'] };
    return {
      replies: [`Linked. Hi ${ctx.snapshot?.firstName ?? 'there'}, you’ll get updates here.\n${SAFETY_LINE}`, menu(ctx.snapshot?.firstName)],
      effect: { type: 'link' },
    };
  }

  if (!ctx.linked) return { replies: [notLinked(ctx.appUrl)] };
  if (ctx.optedOut) return { replies: ['Updates are off for this number. Send START to turn them back on.'] };

  // 4. Scam reports are accepted from linked students.
  if (/^scam\b/i.test(text)) {
    const report = text.replace(/^scam\b[:\s-]*/i, '').trim();
    if (!report) return { replies: [SCAM_HELP] };
    return {
      replies: ['Thank you. The safety team will review it. Don’t reply to the sender, and don’t pay or share anything. If the sender is a ThutoVest sponsor, they are suspended while we check.'],
      effect: { type: 'reportScam', text: report.slice(0, 500) },
    };
  }

  const s = ctx.snapshot;
  if (!s) return { replies: ['I can’t load your updates right now. Please try again later.'] };

  switch (word) {
    case '1':
    case 'new':
    case 'updates':
      return { replies: [whatsNew(s)] };
    case '2':
    case 'deadlines':
      return { replies: [deadlines(s)] };
    case '3':
    case 'offers':
      return { replies: [offers(s, ctx.appUrl)] };
    case '4':
    case 'documents':
    case 'docs':
      return { replies: [documents(s, ctx.appUrl)] };
    case '5':
    case 'funding':
    case 'gap':
      return { replies: [funding(s)] };
    case '6':
    case 'data':
      return { replies: [dataAnswer(s)] };
    case '7':
    case 'scam':
      return { replies: [SCAM_HELP] };
    default:
      return { replies: [menu(s.firstName)] };
  }
}

function notLinked(appUrl: string) {
  return [
    'Hi! This is the official ThutoVest updates number.',
    `To get updates, sign in to the app and open *WhatsApp updates* to get a link code: ${appUrl}`,
    'Registration and documents are only done in the app, never on WhatsApp.',
  ].join('\n');
}

/* ---------------- Proactive alerts (diff two snapshots) ---------------- */

export interface AlertPrefs {
  offers: boolean;
  documents: boolean;
  deadlines: boolean;
  payments: boolean;
  messages: boolean;
}

export const DEFAULT_ALERTS: AlertPrefs = { offers: true, documents: true, deadlines: true, payments: true, messages: true };

/** Messages to send because something changed between `prev` and `next`. */
export function alertsBetween(prev: BotSnapshot | null, next: BotSnapshot, prefs: AlertPrefs = DEFAULT_ALERTS): string[] {
  if (!prev) return [];
  const out: string[] = [];
  const before = new Map(prev.offers.map((o) => [o.id, o]));
  for (const o of next.offers) {
    const was = before.get(o.id);
    if (prefs.offers && o.status === 'offered' && was?.status !== 'offered') {
      out.push(`*New offer:* ${o.sponsor} offered you ${rand(o.amount)} from ${o.fund}. Sign it in the app (about ${DATA_MB.signOffer} MB). Reply 3 for details.`);
    }
    if (prefs.payments && o.status === 'approved' && was?.status !== 'approved') {
      out.push(`*Funding approved:* ${o.sponsor} approved ${rand(o.amount)}. Payment goes straight to ${o.institution ?? 'your institution'}.`);
    }
    if (prefs.payments && o.status === 'paid' && was?.status !== 'paid') {
      out.push(`*Paid:* ${rand(o.amount)} from ${o.sponsor} was paid to ${o.institution ?? 'your institution'}${o.paymentReference ? `, ref ${o.paymentReference}` : ''}. No action needed.`);
    }
  }
  const docsBefore = new Map(prev.documents.map((d) => [d.id, d]));
  for (const d of next.documents) {
    const was = docsBefore.get(d.id);
    if (!prefs.documents) break;
    if (d.status === 'requested' && !was) out.push(`*Document needed:* ${d.sponsor} asked for your ${d.label.toLowerCase()}. Upload it in the app (about ${DATA_MB.uploadPhoto} MB). Reply 4.`);
    if (d.status === 'resubmit' && was?.status !== 'resubmit') out.push(`*New copy needed:* ${d.sponsor} asked for a new ${d.label.toLowerCase()}. Reply 4.`);
    if (d.status === 'approved' && was && was.status !== 'approved') out.push(`*Approved:* your ${d.label.toLowerCase()} was approved by ${d.sponsor}.`);
  }
  if (prefs.deadlines) {
    const prevLeft = new Map(prev.deadlines.map((d) => [d.id, d.daysLeft]));
    for (const d of next.deadlines) {
      const was = prevLeft.get(d.id);
      if (d.daysLeft <= 3 && d.daysLeft >= 0 && (was == null || was > 3)) {
        const mb = deadlineMb(d);
        out.push(`*Reminder:* ${d.title} is ${days(d.daysLeft)}.${mb ? ` It needs data (about ${mb} MB), so plan when to get online.` : ''}`);
      }
    }
  }
  if (prefs.messages && next.sponsorMessages > prev.sponsorMessages) {
    const n = next.sponsorMessages - prev.sponsorMessages;
    out.push(`*Messages:* ${n} new sponsor message${n === 1 ? '' : 's'} in the app. For your safety, messages are only shown in the app.`);
  }
  return out;
}

/* ---------------- Link codes ---------------- */

export const LINK_CODE_MINUTES = 10;

export function newLinkCode(now: Date): { code: string; expiresAt: string } {
  // Cryptographically random, never Math.random: the code proves who owns the number.
  const n = globalThis.crypto.getRandomValues(new Uint32Array(1))[0] % 900000;
  const code = String(100000 + n);
  return { code, expiresAt: new Date(now.getTime() + LINK_CODE_MINUTES * 60_000).toISOString() };
}
