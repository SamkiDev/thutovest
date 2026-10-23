/* ------------------------------------------------------------------
 * Forecasts built from the student's own behaviour.
 * Every number is explainable: each forecast returns the inputs it used.
 * ------------------------------------------------------------------ */
import type { ActivityItem, FundingSourceKind, JourneyTask, StudentState, TaskEvent } from '../types';
import { FUNDING_OPPORTUNITIES } from '../data/fundingOpportunities';
import { summariseFunding, totalCost } from '../utils/funding';
import { fromISODate, startOfDay, toISODate } from '../utils/dates';

const DAY = 86_400_000;
const ASSUMED_PACE = 1.5;

/* ---------- 1. Work pace → deadline outlook ---------- */

export interface TaskProjection {
  task: JourneyTask;
  projectedDate: string;
  daysLate: number; // negative = days to spare
}

export interface PaceForecast {
  perWeek: number;
  completions: number;
  windowDays: number;
  basis: 'history' | 'assumed';
  projections: TaskProjection[];
  lateCount: number;
  firstLate: TaskProjection | null;
  /** Tasks per week needed to meet every deadline. */
  requiredPerWeek: number;
  /** Average days finished before the due date, from past dated tasks. */
  leadDays: number | null;
}

export function completionsInWindow(history: TaskEvent[], now = new Date(), maxWindow = 28) {
  if (!history.length) return { completions: 0, windowDays: 7 };
  const since = now.getTime() - maxWindow * DAY;
  const firstAt = Math.min(...history.map((e) => new Date(e.at).getTime()));
  const windowDays = Math.max(7, Math.min(maxWindow, Math.round((now.getTime() - Math.max(firstAt, since)) / DAY)));
  const completions = history.filter((e) => e.status === 'completed' && new Date(e.at).getTime() >= now.getTime() - windowDays * DAY).length;
  return { completions, windowDays };
}

export function onTimeRate(history: TaskEvent[]): number | null {
  const dated = latestCompletions(history).filter((e) => e.dueDate);
  if (dated.length === 0) return null;
  const ok = dated.filter((e) => toISODate(new Date(e.at)) <= e.dueDate!).length;
  return ok / dated.length;
}

function latestCompletions(history: TaskEvent[]) {
  const map = new Map<string, TaskEvent>();
  for (const e of history) if (e.status === 'completed') map.set(e.taskId, e);
  return [...map.values()];
}

export function forecastPace(state: StudentState, tasks: JourneyTask[], now = new Date()): PaceForecast {
  const { completions, windowDays } = completionsInWindow(state.taskHistory ?? [], now);
  const basis = completions >= 2 ? 'history' : 'assumed';
  const perWeek = basis === 'history' ? completions / (windowDays / 7) : ASSUMED_PACE;

  // Work through open dated tasks in deadline order at the student's pace.
  const open = tasks
    .filter((t) => t.status !== 'completed' && t.dueDate && t.daysLeft != null && t.daysLeft >= 0)
    .sort((a, b) => a.daysLeft! - b.daysLeft! || (a.priority === 'high' ? -1 : 1));
  const today = startOfDay(now);
  let required = 0;
  const projections = open.map((task, i) => {
    // In-progress work counts as half done.
    const effort = open.slice(0, i + 1).reduce((s, t) => s + (t.status === 'in-progress' ? 0.5 : 1), 0);
    const days = Math.ceil((effort / Math.max(perWeek, 0.1)) * 7);
    const projected = new Date(today.getTime() + days * DAY);
    required = Math.max(required, effort / Math.max(task.daysLeft!, 1) * 7);
    return { task, projectedDate: toISODate(projected), daysLate: days - task.daysLeft! };
  });

  const leads = latestCompletions(state.taskHistory ?? [])
    .filter((e) => e.dueDate)
    .map((e) => (fromISODate(e.dueDate!).getTime() - startOfDay(new Date(e.at)).getTime()) / DAY);

  const late = projections.filter((p) => p.daysLate > 0);
  return {
    perWeek: Math.round(perWeek * 10) / 10,
    completions,
    windowDays,
    basis,
    projections,
    lateCount: late.length,
    firstLate: late[0] ?? null,
    requiredPerWeek: Math.round(required * 10) / 10,
    leadDays: leads.length ? Math.round((leads.reduce((a, b) => a + b, 0) / leads.length) * 10) / 10 : null,
  };
}

/* ---------- 2. Activity rhythm → when to nudge ---------- */

const BUCKETS = [
  { id: 'morning', label: 'mornings', range: '06:00–12:00', from: 6, to: 12, nudgeHour: 7 },
  { id: 'afternoon', label: 'afternoons', range: '12:00–17:00', from: 12, to: 17, nudgeHour: 14 },
  { id: 'evening', label: 'evenings', range: '17:00–22:00', from: 17, to: 22, nudgeHour: 18 },
  { id: 'night', label: 'late nights', range: '22:00–06:00', from: 22, to: 30, nudgeHour: 21 },
] as const;

export interface Rhythm {
  sample: number;
  peakLabel: string;
  peakRange: string;
  peakShare: number;
  weekdayShare: number;
  nextNudge: Date | null;
  hourCounts: number[];
}

export function activityRhythm(history: TaskEvent[], activity: ActivityItem[], now = new Date()): Rhythm {
  const stamps = [...history.map((h) => h.at), ...activity.map((a) => a.at)].map((s) => new Date(s));
  const hourCounts = Array.from({ length: 24 }, () => 0);
  stamps.forEach((d) => hourCounts[d.getHours()]++);
  const bucketCount = BUCKETS.map((b) => stamps.filter((d) => {
    const h = d.getHours() < 6 ? d.getHours() + 24 : d.getHours();
    return h >= b.from && h < b.to;
  }).length);
  const peakIdx = bucketCount.indexOf(Math.max(...bucketCount));
  const peak = BUCKETS[peakIdx];
  const weekday = stamps.filter((d) => d.getDay() >= 1 && d.getDay() <= 5).length;
  const weekdayShare = stamps.length ? weekday / stamps.length : 0;
  const nudgeOnWeekdays = weekdayShare >= 0.6;

  let nextNudge: Date | null = null;
  if (stamps.length >= 3) {
    for (let i = 0; i < 8; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      d.setHours(peak.nudgeHour, 30, 0, 0);
      const isWeekday = d.getDay() >= 1 && d.getDay() <= 5;
      if (d > now && (!nudgeOnWeekdays || isWeekday)) {
        nextNudge = d;
        break;
      }
    }
  }
  return {
    sample: stamps.length,
    peakLabel: `${nudgeOnWeekdays ? 'weekday ' : ''}${peak.label}`,
    peakRange: peak.range,
    peakShare: stamps.length ? bucketCount[peakIdx] / stamps.length : 0,
    weekdayShare,
    nextNudge,
    hourCounts,
  };
}

/* ---------- 3. Month-by-month cash flow for the academic year ---------- */

export interface CashMonth {
  month: string;
  inflow: number;
  outflow: number;
  balance: number;
  notes: string[];
}

export interface CashForecast {
  year: number;
  months: CashMonth[];
  firstShortMonth: CashMonth | null;
  lowest: CashMonth;
  assumptions: string[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const INSTITUTION_PAID: FundingSourceKind[] = ['bursary', 'loan'];

export function forecastCashFlow(state: StudentState, now = new Date()): CashForecast {
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const c = state.costs;
  const regFee = Math.round(c.tuition * 0.1);
  const deposit = c.accommodation > 0 ? Math.round(c.accommodation / 10) : 0;
  const out = Array.from({ length: 12 }, () => 0);
  const inn = Array.from({ length: 12 }, () => 0);
  const notes: string[][] = Array.from({ length: 12 }, () => []);

  out[0] += regFee + deposit;
  notes[0].push('Registration payment', ...(deposit ? ['Residence deposit'] : []));
  const tuitionRest = c.tuition - regFee;
  for (let m = 2; m <= 8; m++) out[m] += tuitionRest / 7;
  for (let m = 1; m <= 10; m++) out[m] += (c.accommodation - deposit) / 10 + c.transport / 10 + c.other / 10;
  out[1] += c.books * 0.7;
  out[6] += c.books * 0.3;
  notes[1].push('Textbooks');

  for (const s of state.fundingSources) {
    if (s.id.startsWith('sponsor-')) {
      inn[0] += s.amount;
      notes[0].push(`${s.label} paid before registration`);
    } else if (INSTITUTION_PAID.includes(s.kind)) {
      inn[3] += s.amount;
      notes[3].push(`${s.label} first payment`);
    } else if (s.kind === 'savings') {
      inn[0] += s.amount;
    } else {
      for (let m = 0; m < 12; m++) inn[m] += s.amount / 12;
    }
  }
  for (const [id, amt] of Object.entries(state.awardedAmounts)) {
    if (state.opportunityStatus[id] === 'awarded') {
      inn[3] += amt;
      notes[3].push('Awarded funding first payment');
    }
  }

  let bal = 0;
  const months = MONTHS.map((month, i) => {
    bal += inn[i] - out[i];
    return { month, inflow: Math.round(inn[i]), outflow: Math.round(out[i]), balance: Math.round(bal), notes: notes[i] };
  });
  const lowest = months.reduce((a, b) => (b.balance < a.balance ? b : a));
  return {
    year,
    months,
    firstShortMonth: months.find((m) => m.balance < 0) ?? null,
    lowest,
    assumptions: [
      'Registration payment of about 10% of tuition is due in January.',
      'Remaining tuition is spread from March to September.',
      'Bursaries and loans paid to the institution usually arrive around April.',
      'Sponsor awards on this platform are paid before registration.',
      'Family and work contributions arrive monthly; savings are available in January.',
    ],
  };
}

/* ---------- 4. Funding scenarios ---------- */

export interface FundingScenarios {
  secured: number;
  pending: number;
  pendingItems: { label: string; amount: number }[];
  gapToday: number;
  gapIfPendingSucceeds: number;
  total: number;
}

export function fundingScenarios(state: StudentState, pendingOffers: { label: string; amount: number }[] = []): FundingScenarios {
  const f = summariseFunding(state);
  const items = [...pendingOffers];
  for (const op of FUNDING_OPPORTUNITIES) {
    if (state.opportunityStatus[op.id] !== 'submitted' || op.typicallyCovers.length === 0) continue;
    const est = op.typicallyCovers.reduce((s, k) => s + state.costs[k], 0);
    items.push({ label: `${op.name} (planning estimate)`, amount: est });
  }
  const pending = items.reduce((s, i) => s + i.amount, 0);
  return {
    secured: f.identifiedFunding,
    pending,
    pendingItems: items,
    gapToday: f.gap,
    gapIfPendingSucceeds: Math.max(0, f.totalCost - f.identifiedFunding - pending),
    total: f.totalCost,
  };
}

export function profileCompleteness(state: StudentState): { filled: number; total: number } {
  const p = state.profile;
  const checks = [
    Boolean(p.firstName),
    Boolean(p.province),
    Boolean(p.field),
    p.preferredInstitutionIds.length > 0,
    p.apsEstimate != null,
    p.householdIncome !== 'prefer-not',
    p.documentsReady.includes('id-copy'),
    p.documentsReady.includes('latest-results'),
    p.documentsReady.includes('income-proof'),
    state.verification.identity.status === 'verified',
    totalCost(state.costs) > 0,
  ];
  return { filled: checks.filter(Boolean).length, total: checks.length };
}

