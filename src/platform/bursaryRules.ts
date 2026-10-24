import type { CandidateProfile, CoverItem, Fund, FundApplication, FundTerms, PlatformState } from '../types';

/**
 * Bursary terms and stacking. Used by the app and, through authorize(), by the
 * server, so a student is never funded twice for the same costs:
 * - a student holds at most MAX_BURSARIES sponsor bursaries at a time,
 * - every award is capped at what is still unfunded after the others,
 * - a bursary marked "only bursary" can't be combined with another.
 */
export const MAX_BURSARIES = 2;

/** Statuses where an award is committed to the student. */
const ACTIVE: FundApplication['status'][] = ['accepted', 'approved', 'paid'];

export const COVER_ITEMS: CoverItem[] = ['tuition', 'accommodation', 'books', 'transport', 'other'];
export const COVER_LABEL: Record<CoverItem, string> = {
  tuition: 'Tuition',
  accommodation: 'Accommodation',
  books: 'Books',
  transport: 'Transport',
  other: 'Living costs',
};

/** Older funds have no terms: they cover the full cost, with no conditions. */
export const termsOf = (fund: Fund): FundTerms => fund.terms ?? { covers: 'all' };

export function coversText(terms: FundTerms): string {
  if (terms.covers === 'all' || terms.covers.length === COVER_ITEMS.length) return 'Full cost of study';
  const names = COVER_ITEMS.filter((c) => (terms.covers as CoverItem[]).includes(c)).map((c) => COVER_LABEL[c].toLowerCase());
  const text = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The sponsor's conditions in plain language, for fund cards and the funding agreement. */
export function conditionLines(terms: FundTerms, sponsorName: string): string[] {
  const lines: string[] = [];
  if (terms.minPassMark) lines.push(`Pass with an average of at least ${terms.minPassMark}% each year to keep it.`);
  if (terms.workBackYears) lines.push(`Work for ${sponsorName} for ${terms.workBackYears} ${terms.workBackYears === 1 ? 'year' : 'years'} after you qualify.`);
  lines.push(terms.exclusive ? 'It must be your only bursary.' : 'You may hold one other bursary, up to your total costs.');
  return lines;
}

/** The student's committed sponsor awards, leaving out the given fund's own award. */
export function activeAwards(platform: PlatformState, studentId: string, exceptFundId?: string): FundApplication[] {
  return platform.applications.filter((a) => a.studentId === studentId && ACTIVE.includes(a.status) && a.fundId !== exceptFundId);
}

/** The gap still unfunded after the student's other sponsor awards. CandidateProfile.gap is the gap before them. */
export function remainingGap(candidate: CandidateProfile, platform: PlatformState, exceptFundId?: string): number {
  const awarded = activeAwards(platform, candidate.id, exceptFundId).reduce((sum, a) => sum + Math.max(0, a.amount ?? 0), 0);
  return Math.max(0, candidate.gap - awarded);
}

/** Why this fund can't be added to the student's bursaries, or null if it can. */
export function stackingBlocker(platform: PlatformState, studentId: string, fund: Fund): string | null {
  const others = activeAwards(platform, studentId, fund.id);
  if (others.length >= MAX_BURSARIES) return `${MAX_BURSARIES} bursaries already accepted (the most allowed)`;
  const exclusiveHeld = others.some((a) => {
    const f = platform.funds.find((x) => x.id === a.fundId);
    return f ? Boolean(termsOf(f).exclusive) : false;
  });
  if (exclusiveHeld) return 'An accepted bursary must be the only one';
  if (termsOf(fund).exclusive && others.length > 0) return 'Must be the only bursary, but one is already accepted';
  return null;
}

/** Whitelists terms sent by a browser. */
export function sanitizeTerms(raw: unknown): FundTerms | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const t = raw as Record<string, unknown>;
  const list = Array.isArray(t.covers) ? COVER_ITEMS.filter((c) => (t.covers as unknown[]).includes(c)) : [];
  const covers: FundTerms['covers'] = t.covers === 'all' || list.length === 0 || list.length === COVER_ITEMS.length ? 'all' : list;
  const whole = (v: unknown, max: number) => (typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= max ? v : undefined);
  return {
    covers,
    ...(whole(t.minPassMark, 100) ? { minPassMark: whole(t.minPassMark, 100) } : {}),
    ...(whole(t.workBackYears, 10) ? { workBackYears: whole(t.workBackYears, 10) } : {}),
    ...(t.exclusive === true ? { exclusive: true } : {}),
  };
}
