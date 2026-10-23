import { formatZAR } from '../utils/format';

/**
 * "Check a place before you pay". Combines the NSFAS 2026 accommodation rules
 * (src/data/accommodation.ts) with the warning signs behind most student
 * accommodation scams, and works out what the place does to the student's plan.
 * Every finding says why it fired, like the Risk Radar.
 */

export type PlaceKind = 'residence' | 'private' | 'family';
export type Accreditation = 'institution' | 'nsfas' | 'unsure' | 'no';
export type WarningSign = 'payBeforeViewing' | 'asksLogin' | 'personalAccount' | 'pressure' | 'noLease';

export const WARNING_SIGNS: { id: WarningSign; label: string; why: string }[] = [
  { id: 'payBeforeViewing', label: 'Wants a deposit before I can view the room', why: 'Fake listings take a deposit for a room that doesn’t exist or is already let.' },
  { id: 'asksLogin', label: 'Asked for my NSFAS, myNSFAS or email password, or an OTP', why: 'Nobody needs your login to accommodate you. With it they can redirect your allowance.' },
  { id: 'personalAccount', label: 'Wants cash, an e-wallet or a personal bank account', why: 'Accredited providers are paid through NSFAS or your institution, or invoice from a business account.' },
  { id: 'pressure', label: 'Says I must pay today or lose the room', why: 'Pressure stops you checking. A real provider can wait for you to confirm accreditation.' },
  { id: 'noLease', label: 'Won’t give me a written lease to read first', why: 'NSFAS and institutions expect a lease. Without one you have no proof of what you agreed.' },
];

export interface PlaceInput {
  kind: PlaceKind;
  accreditation: Accreditation;
  /** Monthly rent in rand. */
  monthlyRent: number;
  /** Months in the academic year you will pay for. */
  months: number;
  nsfasFunded: boolean;
  /** Has the student already applied for their institution's residence? Only matters for private places. */
  appliedForResidence: boolean;
  signs: WarningSign[];
  /** Accommodation currently in the student's plan. */
  plannedAccommodation: number;
}

export type Verdict = 'stop' | 'check' | 'ok';

export interface Finding {
  tone: 'clay' | 'amber' | 'veld';
  title: string;
  why: string;
  source?: string;
}

export interface PlaceResult {
  verdict: Verdict;
  headline: string;
  findings: Finding[];
  /** What a year in this place costs. */
  annualCost: number;
  /** Change to the funding gap if this replaces the current plan (positive = gap grows). */
  gapChange: number;
}

export function checkPlace(input: PlaceInput): PlaceResult {
  const findings: Finding[] = [];
  const annualCost = input.kind === 'family' ? 0 : Math.max(0, Math.round(input.monthlyRent)) * Math.max(1, Math.min(12, Math.round(input.months)));

  for (const s of WARNING_SIGNS) {
    if (input.signs.includes(s.id)) findings.push({ tone: 'clay', title: s.label, why: s.why });
  }

  if (input.kind === 'family') {
    if (input.nsfasFunded) {
      findings.push({
        tone: 'amber',
        title: 'No NSFAS accommodation allowance when you live with family',
        why: 'Plan for the transport allowance instead. You can get one or the other, not both.',
        source: 'NSFAS eligibility criteria 2026, 7.1.12 and 5.2.5',
      });
    }
  } else if (input.kind === 'private') {
    if (input.accreditation === 'no' || input.accreditation === 'unsure') {
      findings.push({
        tone: input.nsfasFunded ? 'clay' : 'amber',
        title: input.accreditation === 'no' ? 'This place is not accredited' : 'You haven’t confirmed it is accredited',
        why: input.nsfasFunded
          ? 'NSFAS says it won’t pay an accommodation allowance for unaccredited accommodation without NSFAS and institution permission. Look it up on your institution’s accredited list or your NSFAS accommodation portal.'
          : 'Accredited places have been inspected against your institution’s or NSFAS’s standards. Ask for proof and check it yourself.',
        source: 'NSFAS Student Accommodation page',
      });
    }
    if (input.nsfasFunded && !input.appliedForResidence) {
      findings.push({
        tone: 'amber',
        title: 'Apply for residence first',
        why: 'Institutions may only let NSFAS students consider private accommodation when residences are full, or when there are none.',
        source: 'NSFAS eligibility criteria 2026, 6.1.12 and 6.2.11',
      });
    }
  }

  if (input.kind !== 'family' && input.monthlyRent <= 0) {
    findings.push({ tone: 'amber', title: 'Add the monthly rent', why: 'Without it the app can’t work out what this place does to your funding gap.' });
  }

  const gapChange = annualCost - input.plannedAccommodation;
  if (input.kind !== 'family' && input.monthlyRent > 0 && Math.abs(gapChange) >= 500) {
    findings.push({
      tone: gapChange > 0 ? 'amber' : 'veld',
      title: gapChange > 0 ? `Your funding gap grows by ${formatZAR(gapChange)}` : `Your funding gap shrinks by ${formatZAR(-gapChange)}`,
      why: `A year here costs ${formatZAR(annualCost)}. Your plan has ${formatZAR(input.plannedAccommodation)} for accommodation.`,
    });
  }

  const red = findings.filter((f) => f.tone === 'clay').length;
  const amber = findings.filter((f) => f.tone === 'amber').length;
  const verdict: Verdict = red > 0 ? 'stop' : amber > 0 ? 'check' : 'ok';
  const headline =
    verdict === 'stop'
      ? red > 1
        ? `Don’t pay anything yet: ${red} warning signs`
        : 'Don’t pay anything yet'
      : verdict === 'check'
        ? 'Check these before you sign'
        : 'No warning signs found';

  if (verdict === 'ok') {
    findings.push({
      tone: 'veld',
      title: 'Still confirm before you pay',
      why: 'Get a written lease, view the room, and pay only through the channel your institution or NSFAS tells you to use.',
    });
  }

  return { verdict, headline, findings, annualCost, gapChange };
}
