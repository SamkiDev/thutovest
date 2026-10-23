import type { CandidateProfile, PlatformState, SponsorOrg } from '../types';
import { formatZAR } from '../utils/format';
import { formatDate } from '../utils/dates';
import { forecastFund, learnPreferences, rankCandidates, type LearnedPreferences, type RankedCandidate } from './marketplace';

export interface SponsorInsight {
  id: string;
  tone: 'learned' | 'forecast' | 'action' | 'impact';
  title: string;
  detail: string;
  evidence: string[];
  link?: { label: string; to: string };
}

export interface SponsorBrief {
  prefs: LearnedPreferences;
  rankedByFund: Record<string, RankedCandidate[]>;
  insights: SponsorInsight[];
}

export function sponsorBrief(sponsor: SponsorOrg, platform: PlatformState, candidates: CandidateProfile[]): SponsorBrief {
  const prefs = learnPreferences(platform.decisions[sponsor.id] ?? [], candidates);
  const funds = platform.funds.filter((f) => f.sponsorId === sponsor.id);
  const rankedByFund = Object.fromEntries(funds.map((f) => [f.id, rankCandidates(f, platform, candidates, prefs)]));
  const insights: SponsorInsight[] = [];
  const nameOf = (id: string) => candidates.find((c) => c.id === id)?.firstName ?? 'A student';

  // New interest waiting for a decision.
  const waiting = platform.applications.filter((a) => funds.some((f) => f.id === a.fundId) && a.status === 'interested');
  if (waiting.length) {
    insights.push({
      id: 'waiting',
      tone: 'action',
      title: `${waiting.length} ${waiting.length === 1 ? 'student is' : 'students are'} waiting for a decision`,
      detail: `${waiting.map((a) => nameOf(a.studentId)).join(', ')} shared ${waiting.length === 1 ? 'a profile' : 'profiles'} with you. Reply quickly so strong candidates don’t commit to other funding first.`,
      evidence: waiting.map((a) => `${nameOf(a.studentId)}: shared ${formatDate(a.createdAt.slice(0, 10))}`),
      link: { label: 'Review candidates', to: '/sponsor/candidates' },
    });
  }

  // Documents waiting for review.
  const toReview = platform.documents.filter((d) => d.status === 'shared' && platform.applications.some((a) => a.id === d.applicationId && funds.some((f) => f.id === a.fundId)));
  if (toReview.length) {
    const names = [...new Set(toReview.map((d) => nameOf(platform.applications.find((a) => a.id === d.applicationId)!.studentId)))];
    const issuerOk = toReview.filter((d) => d.snapshot?.issuer === 'verified').length;
    insights.push({
      id: 'review',
      tone: 'action',
      title: `${toReview.length} shared ${toReview.length === 1 ? 'document is' : 'documents are'} ready for review`,
      detail: `From ${names.join(', ')}. All checked automatically${issuerOk ? `, ${issuerOk} confirmed by the issuer` : ''}.`,
      evidence: toReview.map((d) => `${nameOf(platform.applications.find((a) => a.id === d.applicationId)!.studentId)}: ${d.snapshot?.fileName ?? d.kind} (check ${d.snapshot?.check.status ?? 'pending'})`),
      link: { label: 'Review documents', to: '/sponsor/pipeline' },
    });
  }

  // Payment timing.
  const accepted = platform.applications.filter((a) => funds.some((f) => f.id === a.fundId) && a.status === 'approved');
  if (accepted.length) {
    insights.push({
      id: 'pay',
      tone: 'action',
      title: `Pay ${accepted.length === 1 ? nameOf(accepted[0].studentId) + '’s' : accepted.length + ' students’'} institution before registration`,
      detail: 'Registration payments fall due in January, before most bursaries pay out. Paying now prevents a registration block.',
      evidence: accepted.map((a) => `${nameOf(a.studentId)}: ${formatZAR(a.amount ?? 0)} accepted`),
      link: { label: 'Open payments', to: '/sponsor/pipeline' },
    });
  }

  // Learned preferences.
  if (prefs.decisions >= 3) {
    insights.push({
      id: 'learned',
      tone: 'learned',
      title: `Learned from your last ${prefs.decisions} decisions`,
      detail: prefs.likes.length
        ? `You tend to choose ${prefs.likes.map((l) => l.replace(/ \(.*\)$/, '')).slice(0, 3).join(', ')}. Candidates like this are ranked higher.`
        : 'Your decisions don’t show a strong pattern yet, so candidates are ranked on fit alone.',
      evidence: [...prefs.likes.map((l) => `Chosen: ${l}`), ...prefs.dislikes.map((d) => `Passed on: ${d}`)],
      link: { label: 'See ranked candidates', to: '/sponsor/candidates' },
    });
  }

  // Fund forecasts and best unreviewed match.
  for (const f of funds.filter((x) => x.status === 'open')) {
    const ranked = rankedByFund[f.id];
    const fc = forecastFund(f, platform, ranked);
    insights.push({
      id: `fc-${f.id}`,
      tone: 'forecast',
      title: f.name,
      detail: fc.headline,
      evidence: [`Committed ${formatZAR(fc.committed)} of ${formatZAR(f.budget)}`, `${fc.placesLeft} places left`, `${fc.eligibleWaiting} eligible students not yet reviewed`],
      link: { label: 'Open fund', to: `/sponsor/candidates?fund=${f.id}` },
    });
    const top = ranked.find((r) => r.fit.eligible && !r.application);
    if (top) {
      insights.push({
        id: `top-${f.id}-${top.candidate.id}`,
        tone: 'action',
        title: `Strongest unreviewed match: ${top.candidate.firstName}`,
        detail: `${formatZAR(top.fit.suggestedAmount)} would cover ${Math.round(top.fit.coverage * 100)}% of ${top.candidate.firstName}’s gap. Match score ${top.score}${top.learnedBoost ? ` (${top.learnedBoost > 0 ? '+' : ''}${top.learnedBoost} from your preferences)` : ''}.`,
        evidence: top.fit.reasons.slice(0, 4),
        link: { label: 'View candidate', to: `/sponsor/candidates?fund=${f.id}&focus=${top.candidate.id}` },
      });
    }
  }

  // Impact of funded students.
  const paid = platform.applications.filter((a) => funds.some((f) => f.id === a.fundId) && a.status === 'paid');
  const results = paid.flatMap((a) => candidates.find((c) => c.id === a.studentId)?.results ?? []);
  if (results.length) {
    const passed = results.reduce((s, r) => s + r.creditsPassed, 0);
    const taken = results.reduce((s, r) => s + r.creditsTaken, 0);
    insights.push({
      id: 'impact',
      tone: 'impact',
      title: `Your funded students passed ${Math.round((passed / taken) * 100)}% of their credits`,
      detail: `Average mark ${Math.round(results.reduce((s, r) => s + r.average, 0) / results.length)}% across ${results.length} verified semester ${results.length === 1 ? 'result' : 'results'}.`,
      evidence: paid.map((a) => `${nameOf(a.studentId)}: ${formatZAR(a.amount ?? 0)} paid`),
      link: { label: 'See impact', to: '/sponsor#impact' },
    });
  }

  return { prefs, rankedByFund, insights };
}
