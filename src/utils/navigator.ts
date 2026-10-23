/* ------------------------------------------------------------------
 * Student Navigator — scripted demo responses.
 * Keyword intents + the student's live engine data. No external AI.
 * ------------------------------------------------------------------ */
import type { EngineResult, NavigatorReply, StudentState } from '../types';
import { BRAND } from '../config/brand';
import { OFFICIAL } from '../data/officialResources';
import { institutionById } from '../data/institutions';
import { formatDate, relativeDays } from './dates';
import { formatZAR } from './format';
import { fieldLabel, FIT_LABEL } from './matching';

interface Intent {
  id: string;
  keywords: string[];
  reply: (s: StudentState, e: EngineResult) => NavigatorReply;
}

const INTENTS: Intent[] = [
  {
    id: 'next',
    keywords: ['next', 'what should i do', 'start', 'priority', 'focus', 'today', 'orientation'],
    reply: (_s, e) => {
      const n = e.nextAction;
      if (!n) {
        return { paragraphs: ['Every step on your current journey is marked done. Review your profile if your plans have changed, and the engine will add any new steps.'], actions: [{ label: 'Open profile', to: '/app/profile' }] };
      }
      const urgent = e.alerts.filter((a) => a.severity === 'urgent');
      return {
        paragraphs: [
          `Your next best action is “${n.title}”.`,
          n.reason,
          urgent.length > 1 ? `You have ${urgent.length} items marked “Act now”. Clear those before anything else.` : 'After that, work through the items marked “Coming up” on your Risk Radar.',
        ],
        actions: [
          { label: n.routeLabel, to: n.route },
          { label: 'Open Risk Radar', to: '/app/radar' },
        ],
      };
    },
  },
  {
    id: 'funding',
    keywords: ['fund', 'gap', 'afford', 'money', 'pay', 'cost', 'bursar', 'scholarship', 'loan', 'renew', 'progress rule'],
    reply: (s, e) => {
      const f = e.funding;
      return {
        paragraphs: [
          f.gap > 0
            ? `Based on what you’ve entered, your estimated costs are ${formatZAR(f.totalCost)} and identified funding is ${formatZAR(f.identifiedFunding)}, leaving an estimated gap of ${formatZAR(f.gap)}.`
            : `Based on what you’ve entered, your identified funding of ${formatZAR(f.identifiedFunding)} covers your estimated costs of ${formatZAR(f.totalCost)}.`,
          s.profile.fundingNeed === 'no'
            ? 'You said you don’t need funding assistance, so your plan focuses on budgeting rather than applications.'
            : 'Start with bursaries (they don’t need to be repaid), then institutional aid. Treat loans as a last resort and compare terms carefully.',
        ],
        bullets: [
          'Your Funding Gap Solver lists possible matches based on your field and income band.',
          'A “possible match” is not a decision. Only the provider confirms eligibility.',
          'Funded students usually need to pass a minimum number of credits to keep funding the next year.',
        ],
        actions: [{ label: 'Open Funding Gap Solver', to: '/app/funding' }],
        sources: [OFFICIAL.nsfas, OFFICIAL.isfap],
      };
    },
  },
  {
    id: 'nsfas',
    keywords: ['nsfas', 'government bursary', 'income threshold', 'qualify'],
    reply: (s) => ({
      paragraphs: [
        'NSFAS is the government’s student financial aid scheme for public universities and TVET colleges.',
        'Its published criteria have included South African citizenship and a combined household income of up to R350,000 a year (R600,000 for students with disabilities). These rules and the closing dates change, so confirm them on the official NSFAS website.',
        s.profile.householdIncome === 'under-350k'
          ? 'You selected a household income band of up to R350,000, so NSFAS is shown as a possible match on your Funding page. Only NSFAS can confirm eligibility.'
          : s.profile.householdIncome === 'prefer-not'
            ? `You chose not to share your income band, so ${BRAND.name} can’t indicate whether NSFAS is a possible match.`
            : 'Your selected income band is above the threshold NSFAS has published, so other funding may be a better fit. Check the NSFAS website for any exceptions.',
      ],
      actions: [{ label: 'See funding matches', to: '/app/funding#opportunities' }],
      sources: [OFFICIAL.nsfas],
    }),
  },
  {
    id: 'documents',
    keywords: ['document', 'certif', 'upload', 'id copy', 'results', 'report', 'transcript', 'admission', 'letter', 'vault'],
    reply: (_s, e) => {
      const docs = e.tasks.filter((t) => t.kind === 'document');
      const open = docs.filter((t) => t.status !== 'completed');
      return {
        paragraphs: [
          open.length
            ? `You have ${open.length} document ${open.length === 1 ? 'task' : 'tasks'} still open on your journey.`
            : 'All the document tasks on your journey are marked done.',
          'Applications commonly ask for a certified ID copy and your latest results. Many South African Police Service stations certify copies free of charge. Take the original with you.',
          'Keep everything in your Documents vault. Each upload is checked automatically, and you share it with a sponsor in one tap, never by email.',
        ],
        bullets: docs.map((d) => `${d.title}: ${d.status === 'completed' ? 'done' : d.daysLeft != null ? relativeDays(d.daysLeft).toLowerCase() : 'open'}`),
        actions: [
          { label: 'Open Documents', to: '/app/documents' },
          { label: 'Open Journey', to: '/app/journey' },
        ],
      };
    },
  },
  {
    id: 'income',
    keywords: ['income', 'payslip', 'affidavit', 'proof', 'household', 'consent'],
    reply: () => ({
      paragraphs: [
        'Funders usually ask for proof of income for each earning adult in your household: recent payslips, a pension or grant letter, or a sworn affidavit if someone is unemployed or informally employed.',
        'Collect these early. Missing income documents are a common reason funding applications stall.',
      ],
      actions: [{ label: 'Open Journey', to: '/app/journey' }],
      sources: [OFFICIAL.nsfas],
    }),
  },
  {
    id: 'application',
    keywords: ['apply', 'application', 'deadline', 'closing', 'cao', 'provisional', 'offer'],
    reply: (_s, e) => {
      const apps = e.deadlines.filter((t) => t.kind === 'application' || t.kind === 'document').slice(0, 3);
      return {
        paragraphs: [
          'Most universities take online applications directly, while several KwaZulu-Natal institutions use the Central Applications Office (CAO). Each sets its own closing dates, so check the official site for every option you apply to.',
          apps.length
            ? `On your journey, the nearest application items are below (demo dates).`
            : 'You have no open application deadlines on your journey right now.',
        ],
        bullets: apps.map((t) => `${t.title}: ${formatDate(t.dueDate!)} (${relativeDays(t.daysLeft!).toLowerCase()})`),
        actions: [
          { label: 'Open Journey', to: '/app/journey' },
          { label: 'Universities and colleges', to: '/app/institutions' },
        ],
        sources: [
          ..._s.profile.preferredInstitutionIds
            .map(institutionById)
            .filter((i): i is NonNullable<typeof i> => Boolean(i))
            .map((i) => ({ label: `${i.shortName}: ${i.apply.label}`, url: i.apply.url })),
          OFFICIAL.cao,
        ],
      };
    },
  },
  {
    id: 'courses',
    keywords: ['course', 'study', 'qualification', 'degree', 'diploma', ' aps', 'which', 'recommend', 'career'],
    reply: (s, e) => {
      const top = e.matches.filter((m) => m.option.field === s.profile.field).slice(0, 3);
      return {
        paragraphs: [
          `Based on your interest in ${fieldLabel(s.profile.field)} and your preferences, these demo options fit best:`,
          'Fees and APS guides here are demonstration figures. Always confirm entry requirements in the institution’s official prospectus.',
        ],
        bullets: top.map((m) => `${m.option.qualification}, ${m.institution.shortName}: ${FIT_LABEL[m.fit].toLowerCase()}, indicative ${formatZAR(m.option.indicativeTuition)} a year`),
        actions: [{ label: 'Explore study options', to: '/app/explore' }],
      };
    },
  },
  {
    id: 'registration',
    keywords: ['register', 'registration', 'enrol', 'enroll', 're-register'],
    reply: (_s, e) => {
      const reg = e.tasks.filter((t) => t.stageId === 'registration');
      return {
        paragraphs: [
          'Registration is when you formally enrol after accepting an offer. It usually needs your offer letter, ID, final results and either proof of funding or an upfront fee.',
          'If funding isn’t confirmed by then, ask the financial aid office about fee deferrals before registration week.',
        ],
        bullets: reg.map((t) => `${t.title}: ${t.status === 'completed' ? 'done' : 'open'}`),
        actions: [{ label: 'Open Journey', to: '/app/journey' }],
        sources: [OFFICIAL.dhet],
      };
    },
  },
  {
    id: 'accommodation',
    keywords: ['accommodation', 'residence', ' rent', 'housing', 'stay'],
    reply: (s) => ({
      paragraphs: [
        `Your plan currently uses “${s.profile.livingArrangement === 'home' ? 'living at home' : s.profile.livingArrangement === 'residence' ? 'university residence' : 'private accommodation'}” with ${formatZAR(s.costs.accommodation)} for accommodation.`,
        'Residence places are limited and usually allocated early. Apply when you apply for your qualification, and look for accredited private accommodation as a backup.',
        'If NSFAS funds you, it only pays for accredited accommodation, and your institution may only let you go private once its residences are full. You get either an accommodation or a transport allowance, not both.',
      ],
      actions: [
        { label: 'Open Residences', to: '/app/residences' },
        { label: 'Adjust costs', to: '/app/funding' },
      ],
      sources: [{ label: 'NSFAS 2026 eligibility criteria (PDF)', url: 'https://www.nsfas.org.za/content/downloads/Annexure%20A_NSFAS%202026%20Bursary%20Guidelines.pdf' }],
    }),
  },
  {
    id: 'support',
    keywords: ['support', 'stress', 'struggl', 'counsel', 'tutor', 'mental', 'wellbeing'],
    reply: () => ({
      paragraphs: [
        'Every public university has student support services, usually tutoring, writing centres, counselling, disability support and a financial aid office.',
        'If you’re feeling overwhelmed, reaching out early helps. Campus counselling services are confidential, and the South African Depression and Anxiety Group (SADAG) runs free support lines.',
      ],
      actions: [{ label: 'Open Journey', to: '/app/journey' }],
    }),
  },
];

INTENTS.unshift(
  {
    id: 'whatsapp',
    keywords: ['whatsapp', 'no data', 'low on data', 'data bundle', 'offline', 'sms', 'cheap'],
    reply: (s) => ({
      paragraphs: [
        'You can check your updates on WhatsApp when you’re low on data. Reply with a number to see your deadlines, offers, document requests or funding gap, and the bot tells you how much data each app step will use so you can buy data only when you need it.',
        s.whatsapp?.linkedAt
          ? 'Your number is linked, so you’ll get alerts for offers, document requests, payments and deadlines.'
          : 'Link your number once, in the app, with a code. Registration, signing and uploads always stay in the app, where they’re protected.',
      ],
      bullets: ['The bot never asks for money, OTPs, ID numbers or documents', 'Reply STOP at any time to turn it off'],
      actions: [{ label: 'Open WhatsApp updates', to: '/app/whatsapp' }],
    }),
  },
  {
    id: 'scam',
    keywords: ['scam', 'fraud', 'fake', 'admin fee', 'pay to', 'legit', 'suspicious', 'safe'],
    reply: () => ({
      paragraphs: [
        'A real bursary or sponsor will never ask you to pay anything: not an “admin fee”, deposit, airtime or a processing cost.',
        `On ${BRAND.name}, every sponsor passes registration, identity and bank-account checks before you can see them, and money is paid straight to your institution. Messages that ask for payment are blocked automatically and the sender is suspended.`,
      ],
      bullets: ['Never share OTPs, PINs or banking passwords', 'Keep conversations inside the app', 'If someone contacts you elsewhere claiming to be a sponsor, don’t reply. Report it'],
      actions: [{ label: 'See sponsor messages', to: '/app/sponsors#messages' }],
    }),
  },
  {
    id: 'sponsors',
    keywords: ['sponsor', 'company', 'companies', 'fund me', 'funder', 'offer'],
    reply: (s) => ({
      paragraphs: [
        'Verified sponsors publish funds with clear criteria. When you match, your assistant offers to share your anonymised profile: first name, province, field, funding gap and verification badges only.',
        s.discoverable ? 'Sponsor discovery is on, so verified sponsors can find you.' : 'Sponsor discovery is off. Turn it on in Verification so sponsors can find you.',
        'If a sponsor makes an offer, you sign it in the app, share the documents they ask for (always including your admission letter) from your vault, and the money goes to your institution once they approve them. Nothing goes by email.',
      ],
      actions: [
        { label: 'Open Sponsors', to: '/app/sponsors' },
        { label: 'Open Verification', to: '/app/verify' },
      ],
    }),
  },
  {
    id: 'verify',
    keywords: ['verify', 'verification', 'identity', 'id check', 'guardian', 'consent', 'trust'],
    reply: () => ({
      paragraphs: [
        'Verification proves you are real, which protects you and gives sponsors confidence. There are four levels: Unverified, ID verified, Verified and Fully verified.',
        'Identity unlocks sponsor discovery. Adding your offer, results or income raises your level and unlocks more funds. Under-18s also need a parent or guardian’s consent.',
      ],
      actions: [{ label: 'Open Verification', to: '/app/verify' }],
    }),
  },
  {
    id: 'forecast',
    keywords: ['forecast', 'predict', 'run out', 'cash', 'pace', 'on time', 'late', 'when will'],
    reply: () => ({
      paragraphs: [
        'Your Forecast page predicts three things from your own data: whether you’ll meet your deadlines at your current pace, when you’re most likely to act on reminders, and which month your money could run short.',
        'Each prediction shows the data it used, and updates every time you complete a task or change your budget.',
      ],
      actions: [{ label: 'Open Forecast', to: '/app/forecast' }],
    }),
  },
);

const FALLBACK = (s: StudentState): NavigatorReply => ({
  paragraphs: [
    `I’m a scripted demo, so I can answer questions about next steps, funding, NSFAS, documents, applications, study options, registration, accommodation and support, ${s.profile.firstName}.`,
    'Try one of the suggested questions, or rephrase using one of those topics.',
  ],
});

export function detectIntent(text: string): string | null {
  const q = text.toLowerCase();
  // NSFAS beats generic funding when mentioned explicitly.
  if (q.includes('nsfas')) return 'nsfas';
  let best: { id: string; hits: number } | null = null;
  for (const intent of INTENTS) {
    const hits = intent.keywords.filter((k) => q.includes(k)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { id: intent.id, hits };
  }
  return best?.id ?? null;
}

export function answer(text: string, state: StudentState, engine: EngineResult): NavigatorReply {
  const id = detectIntent(text);
  const intent = INTENTS.find((i) => i.id === id);
  return intent ? intent.reply(state, engine) : FALLBACK(state);
}

export const SUGGESTED_QUESTIONS = [
  'What should I do next?',
  'Is a bursary that asks for a fee a scam?',
  'When could I run out of money?',
  'How do sponsors find me?',
  'How do I close my funding gap?',
  'Could NSFAS be an option for me?',
  'Which documents do I still need?',
  'Which courses fit me best?',
  'What happens at registration?',
];

/** Maps ?ask= shortcuts from journey actions to a full question. */
export const ASK_SHORTCUTS: Record<string, string> = {
  application: 'When are my application deadlines?',
  documents: 'Which documents do I still need?',
  income: 'What counts as proof of household income?',
  funding: 'How do I close my funding gap?',
  registration: 'What happens at registration?',
  accommodation: 'How should I plan for accommodation?',
  next: 'What should I do next?',
  support: 'Where can I find student support?',
};
