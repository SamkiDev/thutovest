/**
 * Authorization and input whitelisting for every platform action.
 *
 * This prototype has no server yet, so this runs in the browser and is
 * defence in depth, not a security boundary: anyone can edit their own
 * browser storage. The same rules move to the backend (Supabase Row Level
 * Security policies plus a server function per action) and must be enforced
 * there. Keeping them in one pure function makes that port mechanical.
 */
import type {
  CandidateProfile,
  DocumentKind,
  Fund,
  PlatformState,
  Session,
  SponsorOrg,
  StudentCheckKey,
  StudyField,
  Province,
  IncomeBand,
  TrustLevel,
  VerificationStatus,
} from '../types';
import type { PlatformAction } from './platformReducer';
import { DOCUMENT_INFO } from '../data/documents';
import { validRegistration } from '../utils/trust';

export const LIMITS = {
  message: 1000,
  note: 500,
  name: 80,
  about: 600,
  registration: 20,
  maxAmount: 1_000_000,
  maxBudget: 100_000_000,
  maxPlaces: 1000,
} as const;

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const money = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= max ? Math.round(v) : null);
const isDocKind = (k: unknown): k is DocumentKind => typeof k === 'string' && k in DOCUMENT_INFO;
const isTrust = (v: unknown): v is TrustLevel => v === 0 || v === 1 || v === 2 || v === 3;
const listOrAll = <T extends string>(v: unknown): T[] | 'all' =>
  v === 'all' ? 'all' : Array.isArray(v) ? (v.filter((x) => typeof x === 'string').slice(0, 20) as T[]) : 'all';
const isoDate = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);

function appOf(state: PlatformState, applicationId: string) {
  const app = state.applications.find((a) => a.id === applicationId);
  const fund = app ? state.funds.find((f) => f.id === app.fundId) : undefined;
  return { app, sponsorId: fund?.sponsorId };
}

function shareOf(state: PlatformState, shareId: string) {
  const share = state.documents.find((d) => d.id === shareId);
  return { share, ...(share ? appOf(state, share.applicationId) : { app: undefined, sponsorId: undefined }) };
}

const fundOwner = (state: PlatformState, fundId: string) => state.funds.find((f) => f.id === fundId)?.sponsorId;

/**
 * Returns the action to apply (with untrusted fields whitelisted and clipped),
 * or null when the signed-in user may not perform it.
 */
export function authorize(state: PlatformState, action: PlatformAction, session: Session | null): PlatformAction | null {
  const student = session?.role === 'student' ? session.userId : null;
  const sponsor = session?.role === 'sponsor' ? session.userId : null;

  switch (action.type) {
    // Internal sync and the demo reset: no user-supplied fields to trust.
    case 'hydrate':
    case 'reset':
      return action;

    // ---- Student actions: only on the student's own applications ----
    case 'expressInterest':
      return student && action.studentId === student ? { ...action, studentName: clip(action.studentName, LIMITS.name) } : null;
    case 'respondOffer': {
      const { app } = appOf(state, action.applicationId);
      if (!student || app?.studentId !== student) return null;
      const a = action.agreement;
      return {
        ...action,
        studentName: clip(action.studentName, LIMITS.name),
        agreement: a && {
          ...a,
          signedName: clip(a.signedName, LIMITS.name),
          guardianName: a.guardianName ? clip(a.guardianName, LIMITS.name) : undefined,
        },
      };
    }
    case 'shareDocument': {
      const { app } = shareOf(state, action.shareId);
      return student && app?.studentId === student ? { ...action, studentName: clip(action.studentName, LIMITS.name) } : null;
    }
    case 'publishCandidate': {
      if (!student || action.profile?.id !== student) return null;
      const profile = sanitizeCandidate(action.profile, student);
      return profile ? { type: 'publishCandidate', profile } : null;
    }

    // ---- Messages: either party of the application, as themselves ----
    case 'sendMessage': {
      const { app, sponsorId } = appOf(state, action.applicationId);
      if (!app) return null;
      const allowed = (action.from === 'student' && app.studentId === student) || (action.from === 'sponsor' && sponsorId === sponsor);
      return allowed ? { ...action, text: clip(action.text, LIMITS.message) } : null;
    }

    // ---- Sponsor actions: only on the sponsor's own funds ----
    case 'shortlist':
    case 'declineCandidate': {
      if (!sponsor || fundOwner(state, action.fundId) !== sponsor) return null;
      return action.type === 'declineCandidate' ? { ...action, reason: clip(action.reason, LIMITS.note) } : action;
    }
    case 'sendOffer': {
      if (!sponsor || fundOwner(state, action.fundId) !== sponsor) return null;
      const amount = money(action.amount, LIMITS.maxAmount);
      if (amount == null) return null;
      return { ...action, amount, note: clip(action.note, LIMITS.note), studentName: clip(action.studentName, LIMITS.name), requiredDocs: action.requiredDocs.filter(isDocKind) };
    }
    case 'reviewDocument':
    case 'remindDocument':
    case 'confirmShareIssuer': {
      const { sponsorId } = shareOf(state, action.shareId);
      if (!sponsor || sponsorId !== sponsor) return null;
      return action.type === 'reviewDocument' ? { ...action, note: action.note ? clip(action.note, LIMITS.note) : undefined } : action;
    }
    case 'requestDocument': {
      const { sponsorId } = appOf(state, action.applicationId);
      if (!sponsor || sponsorId !== sponsor || !isDocKind(action.kind)) return null;
      return { ...action, note: action.note ? clip(action.note, LIMITS.note) : undefined };
    }
    case 'approveFunding':
    case 'payInstitution': {
      const { sponsorId } = appOf(state, action.applicationId);
      return sponsor && sponsorId === sponsor ? action : null;
    }
    case 'closeFund':
      return sponsor && fundOwner(state, action.fundId) === sponsor ? action : null;
    case 'saveFund': {
      if (!sponsor) return null;
      const existing = state.funds.find((f) => f.id === action.fund.id);
      if (existing && existing.sponsorId !== sponsor) return null;
      const fund = sanitizeFund(action.fund, sponsor, existing);
      return fund ? { type: 'saveFund', fund } : null;
    }
    case 'setSponsorCheck':
      // In production only the verification service may set these.
      return sponsor && action.sponsorId === sponsor ? action : null;

    // ---- Registration: anyone, but the platform decides status and checks ----
    case 'registerSponsor': {
      if (state.sponsors.some((s) => s.id === action.sponsor.id)) return null;
      const clean = sanitizeSponsor(action.sponsor);
      return clean ? { type: 'registerSponsor', sponsor: clean } : null;
    }
  }
}

/** Only fields a sponsor may edit. Ownership, status and dates are set here, never by the client. */
function sanitizeFund(f: Fund, sponsorId: string, existing?: Fund): Fund | null {
  const budget = money(f.budget, LIMITS.maxBudget);
  const maxPerStudent = money(f.maxPerStudent, LIMITS.maxAmount);
  const places = money(f.places, LIMITS.maxPlaces);
  const closesOn = isoDate(f.closesOn);
  const name = clip(f.name, LIMITS.name);
  if (!budget || !maxPerStudent || !places || !closesOn || !name || maxPerStudent > budget) return null;
  return {
    id: existing?.id ?? f.id,
    sponsorId,
    name,
    description: clip(f.description, LIMITS.about),
    budget,
    maxPerStudent,
    places,
    fields: listOrAll<StudyField>(f.fields),
    provinces: listOrAll<Province>(f.provinces),
    incomeBands: listOrAll<IncomeBand>(f.incomeBands),
    minTrust: isTrust(f.minTrust) ? f.minTrust : 2,
    ...(f.disabilityOnly === true ? { disabilityOnly: true } : {}),
    closesOn,
    status: existing?.status ?? 'open',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}

function sanitizeSponsor(s: SponsorOrg): SponsorOrg | null {
  const type = (['company', 'trust', 'npo'] as const).find((t) => t === s.type);
  const registrationNumber = clip(s.registrationNumber, LIMITS.registration).toUpperCase();
  const name = clip(s.name, LIMITS.name);
  if (!type || name.length < 3 || !validRegistration(type, registrationNumber)) return null;
  return {
    id: s.id,
    name,
    type,
    registrationNumber,
    contactName: clip(s.contactName, LIMITS.name),
    about: clip(s.about, LIMITS.about),
    // A new organisation always starts with every check unverified, whatever the client sent.
    verification: {
      organisation: { status: 'not-started' },
      representative: { status: 'not-started' },
      bank: { status: 'not-started' },
    },
    status: 'active',
    isDemo: false,
    createdAt: new Date().toISOString(),
  };
}

const VERIFICATION_STATUSES: VerificationStatus[] = ['not-started', 'pending', 'verified', 'failed'];
const CHECK_KEYS: StudentCheckKey[] = ['identity', 'enrolment', 'results', 'income', 'guardian'];
const ratio = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
const count = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.round(v))) : 0);

/**
 * Only the anonymised fields a sponsor may see, with types and ranges forced.
 * The id is always the signed-in student's own. Trust and checks are still
 * client-computed in this prototype; in production they come from the
 * verification service, never the student.
 */
function sanitizeCandidate(p: CandidateProfile, studentId: string): CandidateProfile | null {
  if (!p || typeof p !== 'object') return null;
  const firstName = clip(p.firstName, 40);
  if (!firstName) return null;
  const checks = Object.fromEntries(
    CHECK_KEYS.map((k) => [k, VERIFICATION_STATUSES.includes(p.checks?.[k]) ? p.checks[k] : 'not-started']),
  ) as Record<StudentCheckKey, VerificationStatus>;
  const aps = typeof p.apsEstimate === 'number' && p.apsEstimate >= 0 && p.apsEstimate <= 60 ? Math.round(p.apsEstimate) : null;
  return {
    id: studentId,
    firstName,
    province: clip(p.province, 30) as CandidateProfile['province'],
    field: clip(p.field, 40) as CandidateProfile['field'],
    educationStage: clip(p.educationStage, 40) as CandidateProfile['educationStage'],
    institutionId: p.institutionId ? clip(p.institutionId, 40) : null,
    householdIncome: clip(p.householdIncome, 40) as CandidateProfile['householdIncome'],
    apsEstimate: aps,
    isAdult: p.isAdult === true,
    trust: isTrust(p.trust) ? p.trust : 0,
    checks,
    totalCost: count(p.totalCost, LIMITS.maxAmount),
    identifiedFunding: count(p.identifiedFunding, LIMITS.maxAmount),
    gap: count(p.gap, LIMITS.maxAmount),
    onTimeRate: p.onTimeRate == null ? null : ratio(p.onTimeRate),
    tasksCompleted: count(p.tasksCompleted, 1000),
    progressRatio: ratio(p.progressRatio),
    discoverable: p.discoverable === true,
    isLive: true,
  };
}

/** Shape check for state arriving from storage or another tab before it replaces ours. */
export function isPlatformState(v: unknown): v is PlatformState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return (
    s.version === 1 &&
    ['sponsors', 'funds', 'applications', 'messages', 'documents', 'events'].every((k) => Array.isArray(s[k])) &&
    typeof s.decisions === 'object' &&
    s.decisions !== null
  );
}
