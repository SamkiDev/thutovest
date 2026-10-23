import type {
  CostBreakdown,
  FundingOpportunity,
  FundingSummary,
  Institution,
  OpportunityMatch,
  StudentProfile,
  StudentState,
} from '../types';
import { STUDY_OPTIONS } from '../data/studyOptions';
import { institutionById } from '../data/institutions';
import { FUNDING_OPPORTUNITIES } from '../data/fundingOpportunities';
import { formatZAR } from './format';

export const COST_KEYS: (keyof CostBreakdown)[] = ['tuition', 'accommodation', 'books', 'transport', 'other'];

export function totalCost(costs: CostBreakdown): number {
  return COST_KEYS.reduce((sum, k) => sum + Math.max(0, costs[k] || 0), 0);
}

export function summariseFunding(state: Pick<StudentState, 'costs' | 'fundingSources' | 'awardedAmounts' | 'opportunityStatus'>): FundingSummary {
  const total = totalCost(state.costs);
  const entered = state.fundingSources.reduce((s, f) => s + Math.max(0, f.amount || 0), 0);
  const awarded = Object.entries(state.awardedAmounts).reduce(
    (s, [id, amt]) => (state.opportunityStatus[id] === 'awarded' ? s + Math.max(0, amt || 0) : s),
    0,
  );
  const identified = entered + awarded;
  const gap = Math.max(0, total - identified);
  return {
    totalCost: total,
    identifiedFunding: identified,
    awardedFunding: awarded,
    gap,
    coveredRatio: total > 0 ? Math.min(1, identified / total) : 1,
  };
}

/** Rough, transparent planning defaults used to pre-fill the cost plan. */
export function estimateCosts(profile: StudentProfile): CostBreakdown {
  const preferred =
    STUDY_OPTIONS.find((o) => profile.preferredInstitutionIds.includes(o.institutionId) && o.field === profile.field) ??
    STUDY_OPTIONS.find((o) => o.field === profile.field);
  const distance = profile.studyMode === 'distance';
  const tuition = preferred?.indicativeTuition ?? 50000;

  const accommodation = distance ? 0 : { home: 0, residence: 42000, private: 54000 }[profile.livingArrangement];
  const transport = distance ? 1200 : { home: 9600, residence: 4800, private: 6000 }[profile.livingArrangement];
  const books = profile.field === 'health' || profile.field === 'law' ? 8000 : 6500;
  const other = distance ? 7200 : 5400; // distance learners spend more on data

  return { tuition, accommodation, books, transport, other };
}

export function matchOpportunity(op: FundingOpportunity, profile: StudentProfile, institutions: Institution[]): OpportunityMatch {
  const reasons: string[] = [];
  let blockers = 0;
  let unknowns = 0;

  if (op.fields === 'all') reasons.push('Open to all fields of study');
  else if (op.fields.includes(profile.field)) reasons.push('Supports your field of study');
  else {
    reasons.push('Your field is not among its listed focus areas');
    blockers++;
  }

  if (op.incomeBands !== 'all') {
    if (profile.householdIncome === 'prefer-not') {
      reasons.push('Income criteria apply, and you chose not to share your income band');
      unknowns++;
    } else if (op.incomeBands.includes(profile.householdIncome)) {
      reasons.push('Your income band is within its published focus');
    } else {
      reasons.push('Your income band may sit outside its published focus');
      blockers++;
    }
  }

  if (op.institutionTypes !== 'all' && institutions.length > 0) {
    const ok = institutions.some((i) => (op.institutionTypes as string[]).includes(i.type));
    if (ok) reasons.push('Available at institution types on your list');
    else {
      reasons.push('Not usually offered at the institution types on your list');
      blockers++;
    }
  }

  if (op.isDemoRecord) reasons.push('Demonstration record, not a real programme');

  if (blockers > 0) return { level: 'unlikely', label: 'Unlikely fit: check criteria', reasons };
  if (unknowns > 0 || op.type === 'Loan') return { level: 'check', label: 'Check criteria', reasons };
  return { level: 'possible', label: 'Possible match: verify eligibility', reasons };
}

export function preferredInstitutions(profile: StudentProfile): Institution[] {
  return profile.preferredInstitutionIds.map(institutionById).filter((i): i is Institution => Boolean(i));
}

export interface GapIdea {
  id: string;
  title: string;
  detail: string;
  to: string;
}

/** Adaptive, explainable suggestions for closing the gap. Estimates only. */
export function gapIdeas(state: StudentState, gap: number): GapIdea[] {
  if (gap <= 0) return [];
  const ideas: GapIdea[] = [];
  const { profile, costs } = state;

  const institutions = preferredInstitutions(profile);
  const pending = FUNDING_OPPORTUNITIES.filter(
    (op) =>
      op.type !== 'Loan' &&
      (state.opportunityStatus[op.id] ?? 'not-started') === 'not-started' &&
      matchOpportunity(op, profile, institutions).level === 'possible',
  ).length;
  if (profile.fundingNeed !== 'no' && pending > 0) {
    ideas.push({
      id: 'apply',
      title: 'Apply for your possible funding matches',
      detail: `${pending} not started yet. Bursaries aren’t repaid.`,
      to: '/app/funding#opportunities',
    });
  }
  if (costs.accommodation > 0 && profile.livingArrangement !== 'home') {
    ideas.push({
      id: 'home',
      title: 'Compare living at home',
      detail: `${formatZAR(costs.accommodation)} goes on accommodation. Commuting could save this.`,
      to: '/app/profile',
    });
  }
  const cheaper = STUDY_OPTIONS.filter((o) => o.field === profile.field && o.indicativeTuition < costs.tuition - 8000);
  if (cheaper.length > 0) {
    const lowest = cheaper.reduce((a, b) => (a.indicativeTuition < b.indicativeTuition ? a : b));
    ideas.push({
      id: 'cheaper',
      title: 'Look at lower-cost routes into your field',
      detail: `${cheaper.length} cheaper options in your field, from ${formatZAR(lowest.indicativeTuition)} a year.`,
      to: '/app/explore?sort=cost',
    });
  }
  ideas.push({
    id: 'aid-office',
    title: 'Speak to the financial aid office',
    detail: 'Ask about payment plans, fee waivers and emergency funds.',
    to: '/app/navigator?ask=funding',
  });
  return ideas.slice(0, 3);
}
