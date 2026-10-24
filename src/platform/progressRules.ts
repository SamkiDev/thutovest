/**
 * Reads a student's marks and decides whether they are on track, worth
 * watching or at risk. Shared by the student's Progress page, the sponsor's
 * view of the students they fund, and the server (early warnings), so all
 * three always agree.
 */
import type { ApplicationStatus, FundApplication, MarkRecord, PlatformState, SubjectMark, TermSummary } from '../types';

/** An application in these states means the sponsor is funding the student. */
export const FUNDED_STATUSES: ApplicationStatus[] = ['accepted', 'approved', 'paid'];

export const isFunded = (a: FundApplication) => FUNDED_STATUSES.includes(a.status);

export function fundedApplications(platform: PlatformState, studentId: string): FundApplication[] {
  return platform.applications.filter((a) => a.studentId === studentId && isFunded(a));
}

const isLifeOrientation = (subject: string) => /life orientation/i.test(subject);

/** NSC achievement level for a percentage (7 = 80% and above). */
export function nscLevel(mark: number): number {
  if (mark >= 80) return 7;
  if (mark >= 70) return 6;
  if (mark >= 60) return 5;
  if (mark >= 50) return 4;
  if (mark >= 40) return 3;
  if (mark >= 30) return 2;
  return 1;
}

/** APS from school marks: the best six subjects, leaving out Life Orientation (as most universities do). */
export function apsFromMarks(subjects: SubjectMark[]): number | null {
  const counted = subjects.filter((s) => !isLifeOrientation(s.subject));
  if (counted.length < 6) return null;
  return counted
    .map((s) => nscLevel(s.mark))
    .sort((a, b) => b - a)
    .slice(0, 6)
    .reduce((sum, l) => sum + l, 0);
}

export function averageOf(subjects: SubjectMark[]): number {
  const counted = subjects.filter((s) => !isLifeOrientation(s.subject));
  const list = counted.length ? counted : subjects;
  if (!list.length) return 0;
  return Math.round((list.reduce((sum, s) => sum + s.mark, 0) / list.length) * 10) / 10;
}

export function summarise(record: MarkRecord): TermSummary {
  return {
    term: record.term,
    average: averageOf(record.subjects),
    creditsPassed: record.creditsPassed ?? 0,
    creditsTaken: record.creditsTaken ?? 0,
  };
}

export type ProgressStatus = 'on-track' | 'watch' | 'at-risk';

export interface ProgressAnalysis {
  latest: TermSummary | null;
  previous: TermSummary | null;
  /** Change in average since the previous term, in percentage points. */
  change: number | null;
  status: ProgressStatus;
  /** Plain-language reasons for the status, most serious first. */
  reasons: string[];
  passMark?: number;
  /** Subject level (student only): subjects that fell by 5 points or more. */
  subjectsDown: { subject: string; from: number; to: number }[];
  /** Subject level (student only): subjects below 50%, lowest first. */
  weak: SubjectMark[];
  aps: number | null;
  previousAps: number | null;
}

const worse = (a: ProgressStatus, b: ProgressStatus): ProgressStatus => (a === 'at-risk' || b === 'at-risk' ? 'at-risk' : a === 'watch' || b === 'watch' ? 'watch' : 'on-track');
const pts = (n: number) => `${Math.abs(Math.round(n * 10) / 10)} point${Math.abs(n) === 1 ? '' : 's'}`;

/** Averages only: what a funding sponsor can see. */
export function analyseSummaries(results: TermSummary[], passMark?: number): ProgressAnalysis {
  const latest = results.at(-1) ?? null;
  const previous = results.length > 1 ? results[results.length - 2] : null;
  const change = latest && previous ? Math.round((latest.average - previous.average) * 10) / 10 : null;
  const out: ProgressAnalysis = { latest, previous, change, status: 'on-track', reasons: [], passMark, subjectsDown: [], weak: [], aps: null, previousAps: null };
  if (!latest) return out;
  const flag = (status: ProgressStatus, reason: string) => {
    out.status = worse(out.status, status);
    out.reasons.push(reason);
  };

  if (passMark && latest.average < passMark) flag('at-risk', `Average of ${latest.average}% is below the ${passMark}% this bursary requires`);
  else if (!passMark && latest.average < 50) flag('at-risk', `Average of ${latest.average}% is below 50%`);
  if (latest.creditsTaken > 0) {
    const rate = latest.creditsPassed / latest.creditsTaken;
    if (rate < 0.5) flag('at-risk', `Passed ${latest.creditsPassed} of ${latest.creditsTaken} credits`);
    else if (rate < 0.75) flag('watch', `Passed ${latest.creditsPassed} of ${latest.creditsTaken} credits`);
  }
  if (change != null && change <= -5) flag('watch', `Average fell ${pts(change)} since ${previous!.term}`);
  if (passMark && latest.average >= passMark && latest.average < passMark + 3) flag('watch', `Only ${pts(latest.average - passMark)} above the ${passMark}% pass mark`);
  // Most serious first.
  out.reasons.sort((a, b) => Number(/below|Passed \d+ of/.test(b)) - Number(/below|Passed \d+ of/.test(a)));
  return out;
}

/** Full analysis for the student, who can see their own subject marks. */
export function analyseMarks(records: MarkRecord[], passMark?: number): ProgressAnalysis {
  const out = analyseSummaries(records.map(summarise), passMark);
  const latest = records.at(-1);
  const previous = records.length > 1 ? records[records.length - 2] : undefined;
  if (!latest) return out;
  const flag = (status: ProgressStatus, reason: string) => {
    out.status = worse(out.status, status);
    out.reasons.push(reason);
  };

  const before = new Map(previous?.subjects.map((s) => [s.subject.toLowerCase(), s.mark]) ?? []);
  out.subjectsDown = latest.subjects
    .filter((s) => !isLifeOrientation(s.subject))
    .map((s) => ({ subject: s.subject, from: before.get(s.subject.toLowerCase()) ?? s.mark, to: s.mark }))
    .filter((d) => d.from - d.to >= 5)
    .sort((a, b) => b.from - b.to - (a.from - a.to));
  out.weak = latest.subjects.filter((s) => s.mark < 50 && !isLifeOrientation(s.subject)).sort((a, b) => a.mark - b.mark);
  out.aps = apsFromMarks(latest.subjects);
  out.previousAps = previous ? apsFromMarks(previous.subjects) : null;

  for (const s of out.weak.filter((w) => w.mark < 40)) flag('at-risk', `${s.subject} is at ${s.mark}%, below a pass`);
  for (const d of out.subjectsDown) flag('watch', `${d.subject} fell from ${d.from}% to ${d.to}%`);
  return out;
}

export const STATUS_LABEL: Record<ProgressStatus, string> = {
  'on-track': 'On track',
  watch: 'Keep an eye on it',
  'at-risk': 'At risk',
};

/**
 * The early warning a sponsor sends. Written by the platform, not the sponsor,
 * so it is always fair: it explains the requirement, says plainly that no
 * decision has been made, and points to help.
 */
export function warningText(sponsorName: string, fundName: string, latest: TermSummary, passMark: number | undefined, note: string): string {
  const standing = passMark
    ? latest.average < passMark
      ? `below the ${passMark}% this bursary requires`
      : `close to the ${passMark}% this bursary requires`
    : 'lower than before';
  const parts = [
    `Early warning from ${sponsorName} about your ${fundName}.`,
    `Your latest average is ${latest.average}% (${latest.term}), ${standing}.`,
    'This is not a decision to stop your funding.',
    passMark
      ? `If your results don’t satisfy the bursary’s requirement at the next review, you could be at risk of losing this funding.`
      : 'If your results keep falling, your funding could be reviewed.',
    'Let’s make a plan together: reply here, and ask us for a tutor if it would help.',
  ];
  if (note) parts.push(note);
  return parts.join(' ');
}
