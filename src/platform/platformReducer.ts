import type {
  CandidateProfile,
  DocumentKind,
  DocumentShare,
  FundingAgreement,
  Fund,
  FundApplication,
  Message,
  PlatformEvent,
  PlatformState,
  SponsorCheckKey,
  SponsorDecision,
  SponsorOrg,
  VerificationItem,
} from '../types';
import { createPlatformSeed } from '../data/platformSeed';
import { screenMessage } from '../intelligence/moderation';
import { formatZAR } from '../utils/format';
import { makeId } from '../utils/createState';
import { DOCUMENT_INFO, docName } from '../data/documents';
import { GUARDIAN_DOCS, isMinor } from './guardianRules';
import { addDays, todayISO } from '../utils/dates';

export type PlatformAction =
  | { type: 'hydrate'; state: PlatformState }
  | { type: 'reset' }
  | { type: 'expressInterest'; fundId: string; studentId: string; studentName: string; by: 'student' | 'agent' }
  | { type: 'shortlist'; fundId: string; studentId: string; studentName: string }
  | { type: 'declineCandidate'; fundId: string; studentId: string; reason: string }
  | { type: 'sendOffer'; fundId: string; studentId: string; studentName: string; amount: number; note: string; requiredDocs: DocumentKind[] }
  | { type: 'respondOffer'; applicationId: string; accept: boolean; studentName: string; agreement?: FundingAgreement }
  | { type: 'shareDocument'; shareId: string; snapshot: NonNullable<DocumentShare['snapshot']>; studentName: string }
  | { type: 'reviewDocument'; shareId: string; approve: boolean; note?: string }
  | { type: 'requestDocument'; applicationId: string; kind: DocumentKind; note?: string; required: boolean }
  | { type: 'confirmShareIssuer'; shareId: string; ok: boolean }
  | { type: 'approveFunding'; applicationId: string; studentName: string }
  | { type: 'remindDocument'; shareId: string }
  | { type: 'payInstitution'; applicationId: string; institution: string; studentName: string }
  | { type: 'sendMessage'; applicationId: string; from: 'student' | 'sponsor'; text: string }
  | { type: 'saveFund'; fund: Fund }
  | { type: 'closeFund'; fundId: string }
  | { type: 'registerSponsor'; sponsor: SponsorOrg }
  | { type: 'setSponsorCheck'; sponsorId: string; key: SponsorCheckKey; item: VerificationItem }
  /** A signed-in student publishes their anonymised profile so sponsors on other devices can find them. */
  | { type: 'publishCandidate'; profile: CandidateProfile };

const now = () => new Date().toISOString();

function event(state: PlatformState, e: Omit<PlatformEvent, 'id' | 'at'>): PlatformState {
  return { ...state, events: [{ ...e, id: makeId('ev'), at: now() }, ...state.events].slice(0, 80) };
}

function sponsorOfFund(state: PlatformState, fundId: string) {
  const fund = state.funds.find((f) => f.id === fundId);
  const sponsor = fund ? state.sponsors.find((s) => s.id === fund.sponsorId) : undefined;
  return { fund, sponsor };
}

function upsertApplication(
  state: PlatformState,
  fundId: string,
  studentId: string,
  patch: Partial<FundApplication> & Pick<FundApplication, 'status'>,
  initiatedBy: FundApplication['initiatedBy'],
): { state: PlatformState; app: FundApplication } {
  const existing = state.applications.find((a) => a.fundId === fundId && a.studentId === studentId);
  if (existing) {
    const app = { ...existing, ...patch, updatedAt: now() };
    return { state: { ...state, applications: state.applications.map((a) => (a.id === existing.id ? app : a)) }, app };
  }
  const app: FundApplication = { id: makeId('app'), fundId, studentId, initiatedBy, createdAt: now(), updatedAt: now(), ...patch };
  return { state: { ...state, applications: [app, ...state.applications] }, app };
}

function decide(state: PlatformState, sponsorId: string, d: Omit<SponsorDecision, 'at'>): PlatformState {
  const list = (state.decisions[sponsorId] ?? []).filter((x) => !(x.studentId === d.studentId && x.fundId === d.fundId));
  return { ...state, decisions: { ...state.decisions, [sponsorId]: [...list, { ...d, at: now() }] } };
}

function addMessage(state: PlatformState, m: Omit<Message, 'id' | 'at'>): PlatformState {
  return { ...state, messages: [...state.messages, { ...m, id: makeId('msg'), at: now() }] };
}

export function platformReducer(state: PlatformState, action: PlatformAction): PlatformState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'reset':
      return createPlatformSeed();

    case 'expressInterest': {
      const { fund, sponsor } = sponsorOfFund(state, action.fundId);
      if (!fund || !sponsor) return state;
      const r = upsertApplication(state, action.fundId, action.studentId, { status: 'interested' }, action.by);
      let next = addMessage(r.state, {
        applicationId: r.app.id,
        from: 'system',
        text: `${action.studentName} shared a verified, anonymised profile with ${sponsor.name}${action.by === 'agent' ? ' (prepared by the assistant, approved by the student)' : ''}.`,
      });
      return event(next, { audience: 'sponsor', sponsorId: sponsor.id, kind: 'application', text: `${action.studentName} expressed interest in ${fund.name}` });
    }

    case 'shortlist': {
      const { fund, sponsor } = sponsorOfFund(state, action.fundId);
      if (!fund || !sponsor) return state;
      const r = upsertApplication(state, action.fundId, action.studentId, { status: 'shortlisted' }, 'sponsor');
      let next = decide(r.state, sponsor.id, { studentId: action.studentId, fundId: action.fundId, outcome: 'positive' });
      next = event(next, { audience: 'student', studentId: action.studentId, kind: 'application', text: `${sponsor.name} shortlisted you for ${fund.name}` });
      return event(next, { audience: 'sponsor', sponsorId: sponsor.id, kind: 'application', text: `Shortlisted ${action.studentName}` });
    }

    case 'declineCandidate': {
      const { fund, sponsor } = sponsorOfFund(state, action.fundId);
      if (!fund || !sponsor) return state;
      let next = state;
      if (state.applications.some((a) => a.fundId === action.fundId && a.studentId === action.studentId)) {
        next = upsertApplication(state, action.fundId, action.studentId, { status: 'declined-by-sponsor', declineReason: action.reason }, 'sponsor').state;
      }
      return decide(next, sponsor.id, { studentId: action.studentId, fundId: action.fundId, outcome: 'negative', reason: action.reason });
    }

    case 'sendOffer': {
      const { fund, sponsor } = sponsorOfFund(state, action.fundId);
      if (!fund || !sponsor || sponsor.status !== 'active') return state;
      const r = upsertApplication(state, action.fundId, action.studentId, { status: 'offered', amount: action.amount, offerNote: action.note }, 'sponsor');
      let next = decide(r.state, sponsor.id, { studentId: action.studentId, fundId: action.fundId, outcome: 'positive' });
      // Under-18s: the guardian's consent form, ID and proof of guardianship are always required (POPIA, and a minor's contract).
      const student = state.pool.find((p) => p.id === action.studentId);
      const kinds = [...new Set<DocumentKind>(['admission-letter', ...action.requiredDocs, ...(student && isMinor(student) ? GUARDIAN_DOCS : [])])];
      const due = addDays(todayISO(), 14);
      next = {
        ...next,
        documents: [
          ...next.documents.filter((d) => d.applicationId !== r.app.id),
          ...kinds.map((kind) => ({ id: makeId('doc'), applicationId: r.app.id, kind, required: true, status: 'requested' as const, requestedAt: now(), dueOn: due })),
        ],
      };
      next = addMessage(next, {
        applicationId: r.app.id,
        from: 'system',
        text: `${sponsor.name} offered ${formatZAR(action.amount)} from ${fund.name}. Documents needed before payment: ${kinds.map((k) => docName(k)).join(', ')}. Paid straight to the institution.`,
      });
      if (action.note.trim()) {
        const screen = screenMessage(action.note, 'sponsor');
        next = addMessage(next, { applicationId: r.app.id, from: 'sponsor', text: screen.blocked ? action.note : screen.cleanText, flags: screen.flags, blocked: screen.blocked });
      }
      next = event(next, { audience: 'student', studentId: action.studentId, kind: 'offer', text: `New offer: ${formatZAR(action.amount)} from ${sponsor.name}` });
      return event(next, { audience: 'sponsor', sponsorId: sponsor.id, kind: 'offer', text: `Offer of ${formatZAR(action.amount)} sent to ${action.studentName}` });
    }

    case 'respondOffer': {
      const app = state.applications.find((a) => a.id === action.applicationId);
      if (!app || app.status !== 'offered') return state;
      const { fund, sponsor } = sponsorOfFund(state, app.fundId);
      const status = action.accept ? 'accepted' : 'declined-by-student';
      let next: PlatformState = {
        ...state,
        applications: state.applications.map((a) => (a.id === app.id ? { ...a, status, agreement: action.accept ? action.agreement : undefined, updatedAt: now() } : a)),
      };
      next = addMessage(next, {
        applicationId: app.id,
        from: 'system',
        text: action.accept
          ? `${action.studentName} accepted and signed the funding agreement in the app${action.agreement?.guardianName ? `, co-signed by ${action.agreement.guardianName}` : ''}. Next: documents.`
          : `${action.studentName} declined the offer.`,
      });
      return event(next, {
        audience: 'sponsor',
        sponsorId: sponsor?.id,
        kind: 'offer',
        text: `${action.studentName} ${action.accept ? 'accepted' : 'declined'} your ${formatZAR(app.amount ?? 0)} offer${fund ? ` (${fund.name})` : ''}`,
      });
    }

    case 'payInstitution': {
      const app = state.applications.find((a) => a.id === action.applicationId);
      if (!app || app.status !== 'approved') return state;
      const { sponsor } = sponsorOfFund(state, app.fundId);
      const ref = `${(sponsor?.name ?? 'PSA').slice(0, 3).toUpperCase()}-${new Date().getFullYear().toString().slice(2)}-${Math.floor(1000 + Math.random() * 8999)}`;
      let next: PlatformState = {
        ...state,
        applications: state.applications.map((a) => (a.id === app.id ? { ...a, status: 'paid', paymentReference: ref, updatedAt: now() } : a)),
      };
      next = addMessage(next, {
        applicationId: app.id,
        from: 'system',
        text: `${formatZAR(app.amount ?? 0)} paid to the ${action.institution} student fee account. Reference ${ref}.`,
      });
      next = event(next, { audience: 'student', studentId: app.studentId, kind: 'payment', text: `${formatZAR(app.amount ?? 0)} paid to your ${action.institution} fee account` });
      return event(next, { audience: 'sponsor', sponsorId: sponsor?.id, kind: 'payment', text: `Paid ${formatZAR(app.amount ?? 0)} to ${action.institution} for ${action.studentName}` });
    }

    case 'sendMessage': {
      const app = state.applications.find((a) => a.id === action.applicationId);
      if (!app || !action.text.trim()) return state;
      const { sponsor } = sponsorOfFund(state, app.fundId);
      const screen = screenMessage(action.text, action.from);
      let next = addMessage(state, {
        applicationId: app.id,
        from: action.from,
        text: screen.blocked ? action.text : screen.cleanText,
        flags: screen.flags.length ? screen.flags : undefined,
        blocked: screen.blocked,
      });
      if (screen.suspendSender && sponsor) {
        next = {
          ...next,
          sponsors: next.sponsors.map((s) =>
            s.id === sponsor.id ? { ...s, status: 'suspended', suspendedReason: 'Asked a student for payment. Suspended pending review.' } : s,
          ),
        };
        next = addMessage(next, {
          applicationId: app.id,
          from: 'system',
          text: `A message asking for payment was blocked. ${sponsor.name} is suspended while the safety team reviews it.`,
        });
        next = event(next, { audience: 'all', studentId: app.studentId, sponsorId: sponsor.id, kind: 'safety', text: `Blocked a payment request and suspended ${sponsor.name}` });
      } else {
        next = event(next, {
          audience: action.from === 'student' ? 'sponsor' : 'student',
          studentId: app.studentId,
          sponsorId: sponsor?.id,
          kind: 'message',
          text: action.from === 'student' ? 'New message from a student' : `New message from ${sponsor?.name ?? 'a sponsor'}`,
        });
      }
      return next;
    }

    case 'shareDocument': {
      const share = state.documents.find((d) => d.id === action.shareId);
      if (!share) return state;
      const app = state.applications.find((a) => a.id === share.applicationId);
      const { sponsor } = app ? sponsorOfFund(state, app.fundId) : { sponsor: undefined };
      let next: PlatformState = {
        ...state,
        documents: state.documents.map((d) => (d.id === share.id ? { ...d, status: 'shared', sharedAt: now(), snapshot: action.snapshot, reviewNote: undefined } : d)),
      };
      next = addMessage(next, { applicationId: share.applicationId, from: 'system', text: `${action.studentName} shared their ${docName(share.kind)} in the app.` });
      return event(next, { audience: 'sponsor', sponsorId: sponsor?.id, kind: 'document', text: `${action.studentName} shared a ${docName(share.kind)}` });
    }

    case 'reviewDocument': {
      const share = state.documents.find((d) => d.id === action.shareId);
      if (!share || share.status !== 'shared') return state;
      const app = state.applications.find((a) => a.id === share.applicationId);
      const status = action.approve ? 'approved' : 'resubmit';
      let next: PlatformState = {
        ...state,
        documents: state.documents.map((d) => (d.id === share.id ? { ...d, status, reviewedAt: now(), reviewNote: action.note, dueOn: action.approve ? d.dueOn : addDays(todayISO(), 7) } : d)),
      };
      const label = docName(share.kind);
      next = addMessage(next, {
        applicationId: share.applicationId,
        from: 'system',
        text: action.approve ? `Sponsor approved the ${label}.` : `Sponsor asked for a new ${label}: ${action.note || 'see the request for details'}.`,
      });
      return event(next, {
        audience: 'student',
        studentId: app?.studentId,
        kind: 'document',
        text: action.approve ? `Your ${label} was approved` : `Please upload a new ${label}`,
      });
    }

    case 'requestDocument': {
      const app = state.applications.find((a) => a.id === action.applicationId);
      if (!app) return state;
      if (state.documents.some((d) => d.applicationId === app.id && d.kind === action.kind && d.status !== 'approved')) return state;
      const share: DocumentShare = {
        id: makeId('doc'),
        applicationId: app.id,
        kind: action.kind,
        note: action.note,
        required: action.required,
        status: 'requested',
        requestedAt: now(),
        dueOn: addDays(todayISO(), 14),
      };
      let next: PlatformState = { ...state, documents: [...state.documents, share] };
      next = addMessage(next, {
        applicationId: app.id,
        from: 'system',
        text: `Sponsor requested a ${docName(action.kind)} in the app${action.note ? `: ${action.note}` : ''}.`,
      });
      return event(next, { audience: 'student', studentId: app.studentId, kind: 'document', text: `New document request: ${DOCUMENT_INFO[action.kind].label}` });
    }

    case 'remindDocument': {
      const share = state.documents.find((d) => d.id === action.shareId);
      const app = share ? state.applications.find((a) => a.id === share.applicationId) : undefined;
      if (!share || !app) return state;
      const label = docName(share.kind);
      const next = addMessage(state, { applicationId: app.id, from: 'system', text: `Reminder from your sponsor: please share your ${label} in the app.` });
      return event(next, { audience: 'student', studentId: app.studentId, kind: 'document', text: `Reminder: share your ${label}` });
    }

    case 'confirmShareIssuer':
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.shareId && d.snapshot ? { ...d, snapshot: { ...d.snapshot, issuer: action.ok ? 'verified' : 'failed' } } : d,
        ),
      };

    case 'approveFunding': {
      const app = state.applications.find((a) => a.id === action.applicationId);
      if (!app || app.status !== 'accepted') return state;
      const required = state.documents.filter((d) => d.applicationId === app.id && d.required);
      if (required.some((d) => d.status !== 'approved')) return state;
      const { sponsor } = sponsorOfFund(state, app.fundId);
      let next: PlatformState = { ...state, applications: state.applications.map((a) => (a.id === app.id ? { ...a, status: 'approved', updatedAt: now() } : a)) };
      next = addMessage(next, { applicationId: app.id, from: 'system', text: 'All documents approved. Funding approved and payment to the institution is being scheduled.' });
      return event(next, { audience: 'student', studentId: app.studentId, sponsorId: sponsor?.id, kind: 'offer', text: `Funding approved by ${sponsor?.name ?? 'your sponsor'}` });
    }

    case 'saveFund': {
      const exists = state.funds.some((f) => f.id === action.fund.id);
      const next = { ...state, funds: exists ? state.funds.map((f) => (f.id === action.fund.id ? action.fund : f)) : [action.fund, ...state.funds] };
      return event(next, {
        audience: 'all',
        sponsorId: action.fund.sponsorId,
        kind: 'fund',
        text: exists ? `Updated ${action.fund.name}` : `New fund published: ${action.fund.name}`,
      });
    }

    case 'closeFund':
      return { ...state, funds: state.funds.map((f) => (f.id === action.fundId ? { ...f, status: 'closed' } : f)) };

    case 'registerSponsor':
      return { ...state, sponsors: [action.sponsor, ...state.sponsors.filter((s) => s.id !== action.sponsor.id)] };

    case 'setSponsorCheck':
      return {
        ...state,
        sponsors: state.sponsors.map((s) =>
          s.id === action.sponsorId ? { ...s, verification: { ...s.verification, [action.key]: { ...action.item, updatedAt: now() } } } : s,
        ),
      };

    case 'publishCandidate':
      return { ...state, pool: [{ ...action.profile, isLive: true }, ...state.pool.filter((p) => p.id !== action.profile.id)] };

    default:
      return state;
  }
}
