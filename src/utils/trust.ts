import type {
  SponsorCheckKey,
  SponsorOrg,
  StudentCheckKey,
  StudentState,
  StudentVerification,
  TrustLevel,
  VerificationItem,
  VerificationStatus,
} from '../types';

export const STUDENT_CHECKS: { key: StudentCheckKey; title: string; detail: string; production: string }[] = [
  {
    key: 'identity',
    title: 'Identity',
    detail: 'A photo of your ID and a live selfie confirm you are who you say you are.',
    production: 'Document check, face match and liveness through an accredited verification provider, matched against Home Affairs records.',
  },
  {
    key: 'enrolment',
    title: 'Offer or enrolment',
    detail: 'Your institution confirms your offer letter or registration.',
    production: 'Confirmation request to the institution’s admissions or registry office.',
  },
  {
    key: 'results',
    title: 'Academic results',
    detail: 'Your latest results are checked against the issuing school or institution.',
    production: 'Results verification with the school, the Department of Basic Education or the institution.',
  },
  {
    key: 'income',
    title: 'Household income',
    detail: 'With consent, household income is confirmed so funders can trust need-based applications.',
    production: 'Consent-based payslip, SASSA or bank-statement verification.',
  },
  {
    key: 'guardian',
    title: 'Parent or guardian consent',
    detail: 'Required for under-18s before any sponsor can make contact or an offer can be accepted.',
    production: 'Guardian identity check and recorded consent.',
  },
];

export const SPONSOR_CHECKS: { key: SponsorCheckKey; title: string; detail: string }[] = [
  { key: 'organisation', title: 'Organisation registration', detail: 'Registration number matched with the CIPC or NPO register, with an active status.' },
  { key: 'representative', title: 'Authorised representative', detail: 'The person signing up passes an ID and liveness check and is linked to the organisation.' },
  { key: 'bank', title: 'Payment account', detail: 'The paying account is confirmed to belong to the organisation before any offer is sent.' },
];

export const TRUST_LABEL: Record<TrustLevel, string> = {
  0: 'Unverified',
  1: 'ID verified',
  2: 'Verified',
  3: 'Fully verified',
};

export const TRUST_HINT: Record<TrustLevel, string> = {
  0: 'Sponsors can’t see or contact you yet.',
  1: 'Sponsors can discover your anonymised profile.',
  2: 'Eligible for most sponsor funds.',
  3: 'Eligible for every fund, including need-based ones.',
};

export function emptyVerification(): StudentVerification {
  const item = (): VerificationItem => ({ status: 'not-started' });
  return { identity: item(), enrolment: item(), results: item(), income: item(), guardian: item() };
}

export function guardianRequired(state: Pick<StudentState, 'profile'>): boolean {
  return !state.profile.isAdult;
}

/** Trust is computed from checks, never self-declared. */
export function trustLevelFrom(checks: Record<StudentCheckKey, VerificationStatus>, isAdult: boolean): TrustLevel {
  const ok = (k: StudentCheckKey) => checks[k] === 'verified';
  if (!ok('identity')) return 0;
  if (!isAdult && !ok('guardian')) return 1;
  if (ok('enrolment') && ok('income') && ok('results')) return 3;
  if (ok('enrolment') || (ok('results') && ok('income'))) return 2;
  return 1;
}

export function studentChecks(v: StudentVerification): Record<StudentCheckKey, VerificationStatus> {
  return {
    identity: v.identity.status,
    enrolment: v.enrolment.status,
    results: v.results.status,
    income: v.income.status,
    guardian: v.guardian.status,
  };
}

export function studentTrust(state: Pick<StudentState, 'verification' | 'profile'>): TrustLevel {
  return trustLevelFrom(studentChecks(state.verification), state.profile.isAdult);
}

/** What a student must still do before a sponsor may contact them or before an offer can be accepted. */
export function contactBlockers(state: Pick<StudentState, 'verification' | 'profile' | 'discoverable'>): string[] {
  const out: string[] = [];
  if (state.verification.identity.status !== 'verified') out.push('Verify your identity');
  if (!state.profile.isAdult && state.verification.guardian.status !== 'verified') out.push('Get parent or guardian consent');
  if (!state.discoverable) out.push('Turn on sponsor discovery');
  return out;
}

export function sponsorVerified(s: SponsorOrg): boolean {
  return s.status === 'active' && SPONSOR_CHECKS.every((c) => s.verification[c.key].status === 'verified');
}

/** Registration number formats: company 2019/123456/07, NPO 123-456 NPO, trust IT1234/2015. */
export function validRegistration(type: SponsorOrg['type'], value: string): boolean {
  const v = value.trim().toUpperCase();
  if (type === 'company') return /^(19|20)\d{2}\/\d{6}\/\d{2}$/.test(v);
  if (type === 'npo') return /^\d{3}-\d{3}\s?NPO$/.test(v);
  return /^IT\s?\d{1,6}\/\d{4}$/.test(v);
}

export const REGISTRATION_HINT: Record<SponsorOrg['type'], string> = {
  company: 'CIPC format, e.g. 2016/412233/07',
  npo: 'NPO format, e.g. 214-556 NPO',
  trust: 'Master’s Office format, e.g. IT1234/2015',
};
