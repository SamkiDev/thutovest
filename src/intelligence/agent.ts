/* ------------------------------------------------------------------
 * Student agent: looks at the student's data, forecasts, and the
 * marketplace, then either acts (low-risk) or prepares something for the
 * student to approve (anything that shares data or commits them).
 * The agent never accepts offers or submits applications on its own.
 * ------------------------------------------------------------------ */
import type { AgentItem, EngineResult, PlatformState, StudentState } from '../types';
import { FUNDING_OPPORTUNITIES } from '../data/fundingOpportunities';
import { DOCUMENT_INFO } from '../data/documents';
import { INCOME_BANDS } from '../data/labels';
import { matchOpportunity, preferredInstitutions } from '../utils/funding';
import { formatZAR } from '../utils/format';
import { formatDate, relativeDays } from '../utils/dates';
import { contactBlockers, studentTrust, TRUST_LABEL } from '../utils/trust';
import { activityRhythm, forecastCashFlow, forecastPace, profileCompleteness } from './forecast';
import { fundFit, liveCandidate } from './marketplace';

const timeFmt = new Intl.DateTimeFormat('en-ZA', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

export interface AgentBrief {
  items: AgentItem[];
  pending: AgentItem[];
  done: AgentItem[];
}

export function runAgent(state: StudentState, engine: EngineResult, platform: PlatformState, now = new Date()): AgentBrief {
  const items: AgentItem[] = [];
  const pace = forecastPace(state, engine.tasks, now);
  const rhythm = activityRhythm(state.taskHistory ?? [], state.activity, now);
  const cash = forecastCashFlow(state, now);
  const me = liveCandidate(state);
  const trust = studentTrust(state);
  const myApps = platform.applications.filter((a) => a.studentId === state.id);

  // 1. Safety — always first.
  const blockedIds = new Set(platform.messages.filter((m) => m.blocked && myApps.some((a) => a.id === m.applicationId)).map((m) => m.applicationId));
  for (const appId of blockedIds) {
    const app = myApps.find((a) => a.id === appId)!;
    const sponsor = platform.sponsors.find((s) => s.id === platform.funds.find((f) => f.id === app.fundId)?.sponsorId);
    items.push({
      id: `safety-${appId}`,
      kind: 'warning',
      title: `Scam blocked: ${sponsor?.name ?? 'a sender'}`,
      detail: 'They asked for a fee. Message hidden, sender suspended.',
      evidence: ['Message asked for an “admin fee”', 'Message contained a phone number for off-platform payment', 'Sender had not finished verification', 'You don’t need to do anything'],
      mode: 'auto',
      effect: { type: 'none' },
      link: { label: 'See what happened', to: '/app/sponsors#messages' },
    });
  }

  // 2. Offers waiting — the agent highlights but never accepts.
  for (const app of myApps.filter((a) => a.status === 'offered')) {
    const fund = platform.funds.find((f) => f.id === app.fundId);
    const sponsor = platform.sponsors.find((s) => s.id === fund?.sponsorId);
    const cover = engine.funding.gap > 0 ? Math.min(1, (app.amount ?? 0) / engine.funding.gap) : 1;
    items.push({
      id: `offer-${app.id}`,
      kind: 'match',
      title: `${formatZAR(app.amount ?? 0)} offer from ${sponsor?.name}`,
      detail: `Covers ${Math.round(cover * 100)}% of your gap. Only you can accept it.`,
      evidence: ['Paid straight to your institution', `Sponsor verified: ${sponsor?.status === 'active' ? 'yes' : 'no'}`, `Your gap today: ${formatZAR(engine.funding.gap)}`, `Fund: ${fund?.name}`],
      mode: 'approval',
      effect: { type: 'none' },
      link: { label: 'Review offer', to: '/app/sponsors' },
    });
  }

  // 2b. Sponsor document requests — find the document in the vault and offer to share it.
  const activeApps = myApps.filter((a) => a.status === 'accepted' || a.status === 'approved' || a.status === 'paid');
  for (const share of platform.documents.filter((d) => activeApps.some((a) => a.id === d.applicationId) && (d.status === 'requested' || d.status === 'resubmit'))) {
    const app = activeApps.find((a) => a.id === share.applicationId)!;
    const sponsor = platform.sponsors.find((s) => s.id === platform.funds.find((f) => f.id === app.fundId)?.sponsorId);
    const label = DOCUMENT_INFO[share.kind].label;
    const inVault = (state.documents ?? []).find((d) => d.kind === share.kind && d.check.status !== 'failed');
    if (inVault && share.status === 'requested') {
      items.push({
        id: `share-${share.id}-${inVault.id}`,
        kind: 'document',
        title: `${sponsor?.name} needs your ${label.toLowerCase()}`,
        detail: `Already in your vault. Due ${formatDate(share.dueOn)}.`,
        evidence: [
          `Matched “${inVault.fileName}” to the request`,
          `Automatic check: ${inVault.check.status === 'passed' ? 'passed' : 'passed with notes'}`,
          DOCUMENT_INFO[share.kind].issuerCheck ? `Issuer confirmation: ${inVault.issuer === 'verified' ? 'confirmed' : 'not yet'}` : 'No issuer confirmation needed',
          `Payment is released only after every required document is approved`,
        ],
        mode: 'approval',
        approveLabel: 'Share it',
        effect: { type: 'shareDocument', shareId: share.id, documentId: inVault.id },
        link: { label: 'Open documents', to: '/app/documents' },
      });
    } else {
      items.push({
        id: `upload-${share.id}-${share.status}`,
        kind: 'document',
        title: share.status === 'resubmit' ? `${sponsor?.name} asked for a new ${label.toLowerCase()}` : `Upload your ${label.toLowerCase()} for ${sponsor?.name}`,
        detail: `${share.reviewNote ? `Note: “${share.reviewNote}”. ` : ''}Due ${formatDate(share.dueOn)}. Checked before it’s shared.`,
        evidence: [`Requested ${formatDate(share.requestedAt.slice(0, 10))}`, 'Take a photo or choose a file', 'Your award is paid only after the sponsor approves this document'],
        mode: 'approval',
        effect: { type: 'none' },
        link: { label: 'Upload now', to: `/app/documents?upload=${share.kind}&share=${share.id}` },
      });
    }
  }

  // 3. Deadline forecast from the student's own pace.
  if (pace.lateCount > 0 && pace.firstLate) {
    const fl = pace.firstLate;
    items.push({
      id: `pace-${fl.task.id}-${pace.lateCount}`,
      kind: 'forecast',
      title: `${pace.lateCount} ${pace.lateCount === 1 ? 'deadline' : 'deadlines'} at risk at your pace`,
      detail: `Aim for ${pace.requiredPerWeek} tasks a week. Urgent steps moved to the top.`,
      evidence: [
        `“${fl.task.title}” would finish ${formatDate(fl.projectedDate)}, ${fl.daysLate} ${fl.daysLate === 1 ? 'day' : 'days'} late`,
        pace.basis === 'history'
          ? `You finished ${pace.completions} ${pace.completions === 1 ? 'task' : 'tasks'} in the last ${pace.windowDays} days (${pace.perWeek} a week)`
          : `Not enough history yet, so I assumed ${pace.perWeek} tasks a week`,
        `${pace.projections.length} open tasks have deadlines`,
        `Earliest deadline: ${formatDate(pace.projections[0].task.dueDate!)}`,
      ],
      mode: 'auto',
      effect: { type: 'none' },
      link: { label: 'See the forecast', to: '/app/forecast' },
    });
  }

  // 4. Reminder timed to when the student is usually active.
  if (rhythm.nextNudge && engine.nextAction) {
    items.push({
      id: `reminder-${engine.nextAction.taskId ?? 'next'}`,
      kind: 'reminder',
      title: `Reminder: ${timeFmt.format(rhythm.nextNudge)}`,
      detail: `For “${engine.nextAction.title}”, when you usually work.`,
      evidence: [
        `${Math.round(rhythm.peakShare * 100)}% of your last ${rhythm.sample} actions were on ${rhythm.peakLabel} (${rhythm.peakRange})`,
        `${Math.round(rhythm.weekdayShare * 100)}% happened on weekdays`,
      ],
      mode: 'auto',
      effect: { type: 'none' },
    });
  }

  // 5. Prepared application for the strongest external funding match.
  if (state.profile.fundingNeed !== 'no') {
    const insts = preferredInstitutions(state.profile);
    const best = FUNDING_OPPORTUNITIES.find(
      (op) => op.type !== 'Loan' && op.typicallyCovers.length > 0 && (state.opportunityStatus[op.id] ?? 'not-started') === 'not-started' && matchOpportunity(op, state.profile, insts).level === 'possible',
    );
    if (best) {
      const comp = profileCompleteness(state);
      const task = engine.tasks.find((t) => t.id === 't-funding-main');
      items.push({
        id: `prepare-${best.id}`,
        kind: 'prepared',
        title: `${best.name}: ${comp.filled} of ${comp.total} details ready`,
        detail: 'Check the rest, then submit on the official site.',
        evidence: [
          'Pre-filled from your profile and documents',
          `Income band: ${INCOME_BANDS.find((b) => b.value === state.profile.householdIncome)?.label}`,
          `Estimated gap: ${formatZAR(engine.funding.gap)}`,
          task?.daysLeft != null ? `Funding task ${relativeDays(task.daysLeft).toLowerCase()}` : 'Funding task open',
        ],
        mode: 'approval',
        approveLabel: 'Start application',
        effect: { type: 'prepareOpportunity', opportunityId: best.id },
        link: { label: 'View funding', to: '/app/funding#opportunities' },
      });
    }
  }

  // 6. Re-plan after a rejection.
  for (const op of FUNDING_OPPORTUNITIES.filter((o) => state.opportunityStatus[o.id] === 'unsuccessful')) {
    const alternatives = platform.funds.filter((f) => fundFit(f, me, platform).eligible).map((f) => f.name);
    items.push({
      id: `replan-${op.id}`,
      kind: 'replan',
      title: `${op.name} was unsuccessful, so I re-planned`,
      detail: alternatives.length
        ? `${alternatives.length} sponsor ${alternatives.length === 1 ? 'fund matches' : 'funds match'} you instead.`
        : 'Institutional aid and a backup bursary moved up your plan.',
      evidence: [`${op.name} status: unsuccessful`, `Gap now ${formatZAR(engine.funding.gap)}`, ...alternatives.map((a) => `Matching fund: ${a}`)],
      mode: 'auto',
      effect: { type: 'none' },
      link: { label: 'See sponsor matches', to: '/app/sponsors' },
    });
  }

  // 7. Sponsor fund matches.
  const blockers = contactBlockers(state);
  for (const fund of platform.funds) {
    if (myApps.some((a) => a.fundId === fund.id)) continue;
    const fit = fundFit(fund, me, platform);
    const sponsor = platform.sponsors.find((s) => s.id === fund.sponsorId);
    if (fit.eligible && blockers.length === 0) {
      items.push({
        id: `match-${fund.id}`,
        kind: 'match',
        title: `${sponsor?.name}’s ${fund.name} matches you`,
        detail: `Up to ${formatZAR(fit.suggestedAmount)}. Closes ${formatDate(fund.closesOn)}. Anonymised profile only.`,
        evidence: [...fit.reasons.slice(0, 4), 'Shared without your surname, ID number or contact details'],
        mode: 'approval',
        approveLabel: 'Share my profile',
        effect: { type: 'expressInterest', fundId: fund.id },
      });
    } else if (!fit.eligible && fit.trustShort && fit.blockers.length === 1) {
      items.push({
        id: `unlock-${fund.id}`,
        kind: 'match',
        title: `Unlock ${fund.name}`,
        detail: `Needs “${TRUST_LABEL[fund.minTrust]}”. You’re “${TRUST_LABEL[trust]}”.`,
        evidence: [`${sponsor?.name} asks for this level`, ...fit.reasons.slice(0, 3), 'Verifying your results and income takes a few minutes'],
        mode: 'approval',
        effect: { type: 'none' },
        link: { label: 'Open verification', to: '/app/verify' },
      });
    }
  }
  if (blockers.length > 0 && platform.funds.some((f) => f.status === 'open')) {
    items.push({
      id: `blockers-${blockers.join('-')}`,
      kind: 'warning',
      title: 'Sponsors can’t see you yet',
      detail: `To be matched with verified sponsors: ${blockers.join(', ').toLowerCase()}.`,
      evidence: [`Verification level: ${TRUST_LABEL[trust]}`],
      mode: 'approval',
      effect: blockers.length === 1 && !state.discoverable ? { type: 'enableDiscovery' } : { type: 'none' },
      approveLabel: blockers.length === 1 && !state.discoverable ? 'Turn on discovery' : undefined,
      link: { label: 'Open verification', to: '/app/verify' },
    });
  }

  // 8. Cash-flow warning.
  if (cash.firstShortMonth) {
    const m = cash.firstShortMonth;
    items.push({
      id: `cash-${m.month}-${Math.round(m.balance / 1000)}`,
      kind: 'forecast',
      title: `${formatZAR(Math.round(-m.balance / 100) * 100)} short in ${m.month} ${cash.year}`,
      detail: `${m.month === 'Jan' ? 'At registration, before most bursaries pay. ' : ''}Ask about a fee deferral.`,
      evidence: [
        'Sponsor awards on this platform are paid before registration',`January payments: ${formatZAR(cash.months[0].outflow)}`, `Money available in January: ${formatZAR(cash.months[0].inflow)}`, `Lowest point: ${formatZAR(cash.lowest.balance)} in ${cash.lowest.month}`],
      mode: 'auto',
      effect: { type: 'none' },
      link: { label: 'See cash-flow forecast', to: '/app/forecast#cash' },
    });
  }

  const withDecision = items.map((i) => ({ ...i, decision: state.agentDecisions[i.id] }));
  const visible = withDecision.filter((i) => i.decision !== 'dismissed');
  const pending = visible.filter((i) => i.mode === 'approval' && !i.decision);
  const done = visible.filter((i) => i.mode === 'auto' || i.decision === 'approved');
  return { items: visible, pending, done };
}
