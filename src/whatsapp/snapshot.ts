/**
 * Builds the bot's snapshot: the minimum the WhatsApp companion may know.
 * No surname, ID number, documents, message contents or contact details:
 * only titles, dates, amounts and statuses. In production the app upserts
 * this to `bot_snapshots` for the signed-in student (RLS: own row only).
 */
import type { EngineResult, JourneyTask, PlatformState, StudentState } from '../types';
import type { BotDeadline, BotDocumentRequest, BotOffer, BotSnapshot } from '../../supabase/functions/_shared/whatsapp/bot.ts';
import { DOCUMENT_INFO } from '../data/documents';
import { institutionById } from '../data/institutions';
import { activityRhythm } from '../intelligence/forecast';
import { summariseFunding } from '../utils/funding';
import { daysUntil } from '../utils/dates';

const WHERE: Record<JourneyTask['kind'], BotDeadline['where']> = {
  application: 'university-site',
  funding: 'university-site',
  registration: 'university-site',
  document: 'app',
  planning: 'app',
};

export function buildSnapshot(state: StudentState, engine: EngineResult, platform: PlatformState, now = new Date()): BotSnapshot {
  const deadlines: BotDeadline[] = engine.tasks
    .filter((t) => t.status !== 'completed' && t.dueDate && t.daysLeft != null)
    .map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate!, daysLeft: t.daysLeft!, status: t.status === 'in-progress' ? 'in-progress' : 'todo', where: WHERE[t.kind] }));

  const myApps = platform.applications.filter((a) => a.studentId === state.id);
  const appIds = new Set(myApps.map((a) => a.id));
  const fundOf = (fundId: string) => platform.funds.find((f) => f.id === fundId);
  const sponsorOf = (fundId: string) => platform.sponsors.find((s) => s.id === fundOf(fundId)?.sponsorId);
  const institution = institutionById(state.profile.preferredInstitutionIds[0] ?? '')?.shortName;

  const offers: BotOffer[] = myApps
    .filter((a): a is typeof a & { status: BotOffer['status'] } => ['offered', 'accepted', 'approved', 'paid'].includes(a.status))
    .map((a) => {
      const required = platform.documents.filter((d) => d.applicationId === a.id && d.required);
      return {
        id: a.id,
        sponsor: sponsorOf(a.fundId)?.name ?? 'A sponsor',
        fund: fundOf(a.fundId)?.name ?? 'a fund',
        amount: a.amount ?? 0,
        status: a.status,
        institution,
        docsApproved: required.filter((d) => d.status === 'approved').length,
        docsRequired: required.length,
        paymentReference: a.paymentReference,
      };
    });

  const documents: BotDocumentRequest[] = platform.documents
    .filter((d) => appIds.has(d.applicationId))
    .map((d) => {
      const app = myApps.find((a) => a.id === d.applicationId)!;
      return {
        id: d.id,
        label: DOCUMENT_INFO[d.kind].label,
        sponsor: sponsorOf(app.fundId)?.name ?? 'A sponsor',
        status: d.status,
        dueInDays: d.dueOn ? daysUntil(d.dueOn, now) : undefined,
      };
    });

  const sponsorMessages = platform.messages.filter((m) => appIds.has(m.applicationId) && m.from === 'sponsor' && !m.blocked).length;

  const updates = platform.events
    .filter((e) => (e.audience === 'student' || e.audience === 'all') && e.studentId === state.id)
    .slice(0, 5)
    .map((e) => ({ id: e.id, at: e.at, text: e.text }));

  const f = summariseFunding(state);
  const rhythm = activityRhythm(state.taskHistory ?? [], state.activity, now);

  return {
    studentId: state.id,
    firstName: state.profile.firstName,
    generatedAt: now.toISOString(),
    activeTime: rhythm.sample >= 3 ? rhythm.peakLabel : undefined,
    deadlines,
    offers,
    documents,
    funding: { totalCost: f.totalCost, identified: f.identifiedFunding, gap: f.gap },
    sponsorMessages,
    updates,
  };
}
