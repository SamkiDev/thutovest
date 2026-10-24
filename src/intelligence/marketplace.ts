/* ------------------------------------------------------------------
 * Fund ↔ student matching, sponsor preference learning and fund forecasts.
 * ------------------------------------------------------------------ */
import type { CandidateProfile, Fund, FundApplication, PlatformState, SponsorDecision, StudentState } from '../types';
import { FIELDS, INCOME_BANDS } from '../data/labels';
import { institutionById } from '../data/institutions';
import { STUDY_OPTIONS } from '../data/studyOptions';
import { summariseFunding } from '../utils/funding';
import { formatZAR } from '../utils/format';
import { addDays, daysUntil, formatDate, todayISO } from '../utils/dates';
import { studentChecks, studentTrust, TRUST_LABEL } from '../utils/trust';
import { onTimeRate } from './forecast';
import { coversText, remainingGap, stackingBlocker, termsOf } from '../platform/bursaryRules';
import { visibleToSponsors } from '../platform/guardianRules';

const fieldName = (f: string) => FIELDS.find((x) => x.value === f)?.label ?? f;

/** The logged-in student as sponsors see them: anonymised and live. */
export function liveCandidate(state: StudentState): CandidateProfile {
  // The gap before sponsor bursaries: those live on the platform, where every sponsor sees them (bursaryRules.remainingGap).
  const f = summariseFunding({ ...state, fundingSources: state.fundingSources.filter((s) => !s.id.startsWith('sponsor-')) });
  const preferred = state.profile.preferredInstitutionIds[0] ?? null;
  const optionInst = STUDY_OPTIONS.find((o) => o.indicativeTuition === state.costs.tuition)?.institutionId;
  const done = Object.values(state.taskStatus).filter((s) => s === 'completed').length;
  return {
    id: state.id,
    firstName: state.profile.firstName,
    province: state.profile.province,
    field: state.profile.field,
    educationStage: state.profile.educationStage,
    institutionId: optionInst ?? preferred,
    householdIncome: state.profile.householdIncome,
    apsEstimate: state.profile.apsEstimate,
    isAdult: state.profile.isAdult,
    trust: studentTrust(state),
    checks: studentChecks(state.verification),
    totalCost: f.totalCost,
    identifiedFunding: f.identifiedFunding,
    gap: f.gap,
    onTimeRate: onTimeRate(state.taskHistory ?? []),
    tasksCompleted: done,
    progressRatio: Math.min(1, done / 20),
    discoverable: state.discoverable,
    isLive: true,
  };
}

export function allCandidates(platform: PlatformState, student: StudentState | null): CandidateProfile[] {
  const live = student ? liveCandidate(student) : null;
  return [...(live ? [live] : []), ...platform.pool.filter((p) => p.id !== live?.id)];
}

/* ---------- Eligibility ---------- */

export interface FundFit {
  eligible: boolean;
  reasons: string[];
  blockers: string[];
  trustShort: boolean;
  /** Costs still unfunded after the student's other sponsor bursaries. */
  remainingGap: number;
  suggestedAmount: number;
  coverage: number;
}

export function fundFit(fund: Fund, c: CandidateProfile, platform: PlatformState): FundFit {
  const reasons: string[] = [];
  const blockers: string[] = [];
  const sponsor = platform.sponsors.find((s) => s.id === fund.sponsorId);
  if (!sponsor || sponsor.status !== 'active') blockers.push('Sponsor not active');
  if (fund.status !== 'open' || daysUntil(fund.closesOn) < 0) blockers.push('Fund closed');
  if (fund.disabilityOnly) {
    if (c.hasDisability) reasons.push('Supports students with a disability');
    else blockers.push('Only for students with a disability');
  }

  if (fund.fields === 'all') reasons.push('Open to all fields');
  else if (fund.fields.includes(c.field)) reasons.push(`Funds ${fieldName(c.field)}`);
  else blockers.push(`Doesn’t fund ${fieldName(c.field)}`);

  if (fund.provinces === 'all') reasons.push('Any province');
  else if (fund.provinces.includes(c.province)) reasons.push(`Includes ${c.province}`);
  else blockers.push(`Doesn’t include ${c.province}`);

  if (fund.incomeBands !== 'all') {
    if (fund.incomeBands.includes(c.householdIncome)) reasons.push(`Household income in range (${INCOME_BANDS.find((b) => b.value === c.householdIncome)?.label})`);
    else blockers.push('Household income outside the fund’s focus');
  }

  const trustShort = c.trust < fund.minTrust;
  if (trustShort) blockers.push(`Needs “${TRUST_LABEL[fund.minTrust]}” status (you have “${TRUST_LABEL[c.trust]}”)`);
  else reasons.push(`Meets the “${TRUST_LABEL[fund.minTrust]}” requirement`);

  const stacking = stackingBlocker(platform, c.id, fund);
  if (stacking) blockers.push(stacking);
  const gap = remainingGap(c, platform, fund.id);
  if (gap <= 0) blockers.push(gap < c.gap ? 'Other bursaries already cover the gap' : 'No funding gap');
  reasons.push(`Covers: ${coversText(termsOf(fund)).toLowerCase()}`);

  const suggestedAmount = Math.max(0, Math.min(fund.maxPerStudent, gap, remainingBudget(fund, platform)));
  const coverage = gap > 0 ? suggestedAmount / gap : 0;
  if (coverage >= 0.99) reasons.push(`One award of ${formatZAR(suggestedAmount)} closes the whole gap`);
  else if (suggestedAmount > 0) reasons.push(`An award could cover ${Math.round(coverage * 100)}% of the gap`);

  return { eligible: blockers.length === 0, reasons, blockers, trustShort, remainingGap: gap, suggestedAmount, coverage };
}

export function committed(fund: Fund, platform: PlatformState): number {
  return platform.applications
    .filter((a) => a.fundId === fund.id && (a.status === 'offered' || a.status === 'accepted' || a.status === 'approved' || a.status === 'paid'))
    .reduce((s, a) => s + (a.amount ?? 0), 0);
}

export function remainingBudget(fund: Fund, platform: PlatformState): number {
  return Math.max(0, fund.budget - committed(fund, platform));
}

/* ---------- Sponsor preference learning ---------- */

type Feature = { key: string; label: string };

function features(c: CandidateProfile): Feature[] {
  const f: Feature[] = [
    { key: `field:${c.field}`, label: fieldName(c.field) },
    { key: `province:${c.province}`, label: `students from ${c.province}` },
    { key: `gap:${c.gap <= 60000 ? 'small' : 'large'}`, label: c.gap <= 60000 ? 'gaps of R60,000 or less' : 'gaps above R60,000' },
    { key: `trust:${c.trust >= 3 ? 'full' : 'partial'}`, label: c.trust >= 3 ? 'fully verified students' : 'partly verified students' },
  ];
  if (c.onTimeRate != null) {
    f.push({ key: `ontime:${c.onTimeRate >= 0.8 ? 'high' : 'low'}`, label: c.onTimeRate >= 0.8 ? 'on-time rates of 80% or more' : 'on-time rates below 80%' });
  }
  return f;
}

export interface LearnedPreferences {
  decisions: number;
  weights: Record<string, number>;
  likes: string[];
  dislikes: string[];
}

export function learnPreferences(decisions: SponsorDecision[], candidates: CandidateProfile[]): LearnedPreferences {
  const tally: Record<string, { pos: number; neg: number; label: string }> = {};
  for (const d of decisions) {
    const c = candidates.find((x) => x.id === d.studentId);
    if (!c) continue;
    for (const f of features(c)) {
      tally[f.key] ??= { pos: 0, neg: 0, label: f.label };
      tally[f.key][d.outcome === 'positive' ? 'pos' : 'neg']++;
    }
  }
  const weights: Record<string, number> = {};
  const likes: string[] = [];
  const dislikes: string[] = [];
  for (const [k, t] of Object.entries(tally)) {
    weights[k] = (t.pos - t.neg) / (t.pos + t.neg + 1);
    if (t.pos >= 2 && t.neg === 0) likes.push(`${t.label} (${t.pos} of ${t.pos})`);
    if (t.neg >= 1 && t.pos === 0) dislikes.push(t.label);
  }
  likes.sort((a, b) => Number(b.match(/\((\d+)/)?.[1]) - Number(a.match(/\((\d+)/)?.[1]));
  return { decisions: decisions.length, weights, likes: likes.slice(0, 4), dislikes: dislikes.slice(0, 3) };
}

export interface RankedCandidate {
  candidate: CandidateProfile;
  fit: FundFit;
  score: number;
  learnedBoost: number;
  application?: FundApplication;
  institutionName: string;
}

export function rankCandidates(fund: Fund, platform: PlatformState, candidates: CandidateProfile[], prefs: LearnedPreferences): RankedCandidate[] {
  return candidates
    .filter((c) => c.discoverable && c.trust >= 1 && visibleToSponsors(c))
    .map((c) => {
      const fit = fundFit(fund, c, platform);
      // Coverage 25 + on-time record 20 + verification 15 + base 20 = 80 before learning.
      const base = 20 + fit.coverage * 25 + (c.onTimeRate ?? 0.6) * 20 + c.trust * 5 - fit.blockers.length * 8;
      const learnedBoost = Math.round(features(c).reduce((s, f) => s + (prefs.weights[f.key] ?? 0) * 4, 0));
      return {
        candidate: c,
        fit,
        score: Math.max(0, Math.min(100, Math.round(base + learnedBoost))),
        learnedBoost,
        application: platform.applications.find((a) => a.fundId === fund.id && a.studentId === c.id),
        institutionName: c.institutionId ? institutionById(c.institutionId)?.shortName ?? '' : '',
      };
    })
    .sort((a, b) => Number(b.fit.eligible) - Number(a.fit.eligible) || b.score - a.score);
}

/* ---------- Fund forecast ---------- */

export interface FundForecast {
  committed: number;
  remaining: number;
  placesLeft: number;
  eligibleWaiting: number;
  weeklyPace: number;
  exhaustDate: string | null;
  headline: string;
}

export function forecastFund(fund: Fund, platform: PlatformState, ranked: RankedCandidate[]): FundForecast {
  const used = committed(fund, platform);
  const remaining = Math.max(0, fund.budget - used);
  const awards = platform.applications.filter((a) => a.fundId === fund.id && ['offered', 'accepted', 'approved', 'paid'].includes(a.status));
  const placesLeft = Math.max(0, fund.places - awards.length);
  const since = Date.now() - 28 * 86_400_000;
  const recent = awards.filter((a) => new Date(a.updatedAt).getTime() >= since).reduce((s, a) => s + (a.amount ?? 0), 0);
  const weeklyPace = recent / 4;
  const weeks = weeklyPace > 0 ? remaining / weeklyPace : null;
  const exhaustDate = weeks != null ? addDays(todayISO(), Math.round(weeks * 7)) : null;
  const eligibleWaiting = ranked.filter((r) => r.fit.eligible && !r.application).length;
  let headline: string;
  if (remaining === 0) headline = 'Fully committed.';
  else if (exhaustDate && exhaustDate <= fund.closesOn)
    headline = `Fully committed by about ${formatDate(exhaustDate)}, before it closes, at about ${formatZAR(Math.round(weeklyPace / 1000) * 1000)} a week.`;
  else if (exhaustDate)
    headline = `${formatZAR(Math.round(Math.max(0, remaining - weeklyPace * (daysUntil(fund.closesOn) / 7)) / 1000) * 1000)} likely unspent when it closes on ${formatDate(fund.closesOn)}.`;
  else headline = `${eligibleWaiting} eligible students waiting. No awards in four weeks.`;
  return { committed: used, remaining, placesLeft, eligibleWaiting, weeklyPace, exhaustDate, headline };
}
