import type {
  ActivityItem,
  AgentDecision,
  VaultDocument,
  VerificationStatus,
  StudentCheckKey,
  VerificationItem,
  CostBreakdown,
  CostKey,
  FundingSource,
  OpportunityStatus,
  StudentProfile,
  StudentState,
  TaskStatus,
  WhatsAppAlertPrefs,
} from '../types';
import { taskById } from '../data/journey';
import { optionById } from '../data/studyOptions';
import { institutionById } from '../data/institutions';
import { opportunityById } from '../data/fundingOpportunities';
import { OPPORTUNITY_STATUS, TASK_STATUS_LABEL } from '../data/labels';
import { BUDGET_SOURCE_ID, createDemoState, createStateFromProfile, makeId } from '../utils/createState';
import { estimateCosts } from '../utils/funding';
import { formatZAR } from '../utils/format';
import { addDays } from '../utils/dates';

export type StudentAction =
  | { type: 'loadDemo' }
  | { type: 'completeOnboarding'; profile: StudentProfile }
  | { type: 'reset' }
  | { type: 'setTaskStatus'; taskId: string; status: TaskStatus }
  | { type: 'setCost'; key: CostKey; value: number }
  | { type: 'resetCostsToEstimate' }
  | { type: 'useOptionForCosts'; optionId: string }
  | { type: 'addSource'; source: Omit<FundingSource, 'id'> }
  | { type: 'updateSource'; id: string; patch: Partial<Omit<FundingSource, 'id'>> }
  | { type: 'removeSource'; id: string }
  | { type: 'setOpportunityStatus'; id: string; status: OpportunityStatus }
  | { type: 'setAwardedAmount'; id: string; amount: number }
  | { type: 'toggleSaved'; optionId: string }
  | { type: 'toggleCompare'; optionId: string }
  | { type: 'clearCompare' }
  | { type: 'updateProfile'; profile: StudentProfile }
  | { type: 'hydrate'; state: StudentState | null }
  | { type: 'setVerification'; key: StudentCheckKey; item: VerificationItem; log?: string }
  | { type: 'setGuardian'; name: string; relationship: string }
  | { type: 'setDiscoverable'; value: boolean }
  | { type: 'whatsappRequestCode'; phone: string; code: string; expiresAt: string }
  | { type: 'whatsappLinked' }
  | { type: 'whatsappOptOut'; value: boolean }
  | { type: 'whatsappAlerts'; alerts: WhatsAppAlertPrefs }
  | { type: 'whatsappUnlink' }
  | { type: 'agentDecision'; id: string; decision: AgentDecision }
  | { type: 'addSponsorAward'; applicationId: string; label: string; amount: number }
  | { type: 'log'; text: string; kind: ActivityItem['kind'] }
  | { type: 'addDocument'; document: VaultDocument }
  | { type: 'removeDocument'; id: string }
  | { type: 'setDocumentIssuer'; id: string; status: VerificationStatus };

function log(state: StudentState, text: string, kind: ActivityItem['kind']): StudentState {
  const item: ActivityItem = { id: makeId('act'), at: new Date().toISOString(), text, kind };
  return { ...state, activity: [item, ...state.activity].slice(0, 30) };
}

function withShortlistRule(state: StudentState): StudentState {
  // Adaptive: saving three options completes the shortlist step automatically.
  if (state.savedOptionIds.length >= 3 && state.taskStatus['t-shortlist'] !== 'completed') {
    return log(
      { ...state, taskStatus: { ...state.taskStatus, 't-shortlist': 'completed' } },
      'Shortlist complete: three options saved',
      'task',
    );
  }
  return state;
}

export function studentReducer(state: StudentState | null, action: StudentAction): StudentState | null {
  if (action.type === 'loadDemo') return createDemoState();
  if (action.type === 'completeOnboarding') return createStateFromProfile(action.profile);
  if (action.type === 'reset') return null;
  if (action.type === 'hydrate') return action.state;
  if (!state) return state;

  switch (action.type) {
    case 'setTaskStatus': {
      const prev = state.taskStatus[action.taskId] ?? 'pending';
      if (prev === action.status) return state;
      const task = taskById(action.taskId);
      const event = {
        taskId: action.taskId,
        status: action.status,
        at: new Date().toISOString(),
        dueDate: task?.dueInDays != null ? addDays(state.demoStart, task.dueInDays) : undefined,
      };
      let next: StudentState = {
        ...state,
        taskStatus: { ...state.taskStatus, [action.taskId]: action.status },
        taskHistory: [...(state.taskHistory ?? []), event].slice(-200),
      };
      // Keep onboarding document answers consistent with task status.
      if (task?.document) {
        const docs = new Set(next.profile.documentsReady);
        if (action.status === 'completed') docs.add(task.document);
        else docs.delete(task.document);
        next = { ...next, profile: { ...next.profile, documentsReady: [...docs] } };
      }
      const verb =
        action.status === 'completed'
          ? 'Marked'
          : prev === 'completed'
            ? 'Reopened'
            : 'Moved';
      const text =
        action.status === 'completed'
          ? `${verb} “${task?.title ?? action.taskId}” as done`
          : prev === 'completed'
            ? `${verb} “${task?.title ?? action.taskId}”`
            : `${verb} “${task?.title ?? action.taskId}” to ${TASK_STATUS_LABEL[action.status].toLowerCase()}`;
      return log(next, text, 'task');
    }

    case 'setCost':
      return {
        ...state,
        costs: { ...state.costs, [action.key]: Math.max(0, Math.round(action.value)) },
        costsCustomised: true,
      };

    case 'resetCostsToEstimate':
      return log({ ...state, costs: estimateCosts(state.profile), costsCustomised: false }, 'Reset costs to the profile estimate', 'funding');

    case 'useOptionForCosts': {
      const opt = optionById(action.optionId);
      if (!opt) return state;
      const inst = institutionById(opt.institutionId);
      return log(
        { ...state, costs: { ...state.costs, tuition: opt.indicativeTuition }, costsCustomised: true },
        `Used ${opt.qualification}${inst ? ` (${inst.shortName})` : ''} for tuition: ${formatZAR(opt.indicativeTuition)}`,
        'funding',
      );
    }

    case 'addSource': {
      const source: FundingSource = { ...action.source, id: makeId('src') };
      return log(
        { ...state, fundingSources: [...state.fundingSources, source] },
        `Added funding source “${source.label}” (${formatZAR(source.amount)})`,
        'funding',
      );
    }

    case 'updateSource': {
      const fundingSources = state.fundingSources.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s));
      let profile = state.profile;
      if (action.id === BUDGET_SOURCE_ID && action.patch.amount != null) {
        profile = { ...profile, annualBudget: Math.max(0, action.patch.amount) };
      }
      return { ...state, fundingSources, profile };
    }

    case 'removeSource': {
      const src = state.fundingSources.find((s) => s.id === action.id);
      return log(
        { ...state, fundingSources: state.fundingSources.filter((s) => s.id !== action.id) },
        `Removed funding source “${src?.label ?? 'source'}”`,
        'funding',
      );
    }

    case 'setOpportunityStatus': {
      const op = opportunityById(action.id);
      const label = OPPORTUNITY_STATUS.find((o) => o.value === action.status)?.label ?? action.status;
      let next: StudentState = { ...state, opportunityStatus: { ...state.opportunityStatus, [action.id]: action.status } };
      // Adaptive: starting/submitting a non-loan application completes the main funding step.
      if (
        (action.status === 'submitted' || action.status === 'awarded') &&
        op?.type !== 'Loan' &&
        next.taskStatus['t-funding-main'] !== 'completed'
      ) {
        next = { ...next, taskStatus: { ...next.taskStatus, 't-funding-main': 'completed' } };
      } else if (action.status === 'preparing' && (next.taskStatus['t-funding-main'] ?? 'pending') === 'pending') {
        next = { ...next, taskStatus: { ...next.taskStatus, 't-funding-main': 'in-progress' } };
      }
      return log(next, `${op?.name ?? 'Funding opportunity'} status set to ${label.toLowerCase()}`, 'funding');
    }

    case 'setAwardedAmount':
      return { ...state, awardedAmounts: { ...state.awardedAmounts, [action.id]: Math.max(0, Math.round(action.amount)) } };

    case 'toggleSaved': {
      const saved = state.savedOptionIds.includes(action.optionId);
      const opt = optionById(action.optionId);
      const next: StudentState = {
        ...state,
        savedOptionIds: saved
          ? state.savedOptionIds.filter((id) => id !== action.optionId)
          : [...state.savedOptionIds, action.optionId],
      };
      return withShortlistRule(log(next, `${saved ? 'Removed' : 'Saved'} ${opt?.qualification ?? 'option'} ${saved ? 'from' : 'to'} your shortlist`, 'explore'));
    }

    case 'toggleCompare': {
      const inList = state.compareIds.includes(action.optionId);
      if (!inList && state.compareIds.length >= 3) return state;
      return {
        ...state,
        compareIds: inList ? state.compareIds.filter((id) => id !== action.optionId) : [...state.compareIds, action.optionId],
      };
    }

    case 'clearCompare':
      return { ...state, compareIds: [] };

    case 'updateProfile': {
      const profile = action.profile;
      let next: StudentState = { ...state, profile };
      // Keep the "own contribution" funding line in sync with the budget.
      const hasBudgetSource = next.fundingSources.some((s) => s.id === BUDGET_SOURCE_ID);
      if (hasBudgetSource) {
        next.fundingSources = next.fundingSources.map((s) => (s.id === BUDGET_SOURCE_ID ? { ...s, amount: profile.annualBudget } : s));
      } else if (profile.annualBudget > 0) {
        next.fundingSources = [
          { id: BUDGET_SOURCE_ID, label: 'Family / own contribution', kind: 'family', amount: profile.annualBudget },
          ...next.fundingSources,
        ];
      }
      // Re-estimate costs unless the student has edited them by hand;
      // living arrangement always updates accommodation & transport.
      const est = estimateCosts(profile);
      const costs: CostBreakdown = state.costsCustomised
        ? { ...state.costs, accommodation: est.accommodation, transport: est.transport }
        : est;
      if (
        state.profile.livingArrangement !== profile.livingArrangement ||
        state.profile.studyMode !== profile.studyMode ||
        !state.costsCustomised
      ) {
        next.costs = costs;
      }
      // Keep document task statuses in line with the documents checklist.
      const taskStatus = { ...next.taskStatus };
      for (const [taskId, doc] of [
        ['t-doc-id', 'id-copy'],
        ['t-doc-results', 'latest-results'],
        ['t-doc-income', 'income-proof'],
      ] as const) {
        const has = profile.documentsReady.includes(doc);
        if (has) taskStatus[taskId] = 'completed';
        else if (taskStatus[taskId] === 'completed') taskStatus[taskId] = 'pending';
      }
      next.taskStatus = taskStatus;
      return log(next, 'Updated your profile and preferences', 'profile');
    }

    case 'setVerification': {
      const next: StudentState = {
        ...state,
        verification: { ...state.verification, [action.key]: { ...action.item, updatedAt: new Date().toISOString() } },
      };
      return action.log ? log(next, action.log, 'profile') : next;
    }

    case 'setGuardian':
      return {
        ...state,
        verification: { ...state.verification, guardianName: action.name, guardianRelationship: action.relationship },
      };

    case 'whatsappRequestCode':
      return {
        ...state,
        whatsapp: {
          phone: action.phone,
          consentAt: new Date().toISOString(),
          pending: { code: action.code, expiresAt: action.expiresAt },
          optedOut: false,
          alerts: state.whatsapp?.alerts ?? { offers: true, documents: true, deadlines: true, payments: true, messages: true },
        },
      };
    case 'whatsappLinked':
      if (!state.whatsapp?.pending) return state;
      return log({ ...state, whatsapp: { ...state.whatsapp, pending: undefined, linkedAt: new Date().toISOString(), optedOut: false } }, 'Linked WhatsApp for updates', 'system');
    case 'whatsappOptOut':
      return state.whatsapp ? log({ ...state, whatsapp: { ...state.whatsapp, optedOut: action.value } }, action.value ? 'Turned off WhatsApp updates' : 'Turned WhatsApp updates back on', 'system') : state;
    case 'whatsappAlerts':
      return state.whatsapp ? { ...state, whatsapp: { ...state.whatsapp, alerts: action.alerts } } : state;
    case 'whatsappUnlink':
      return log({ ...state, whatsapp: undefined }, 'Unlinked WhatsApp. No more messages will be sent.', 'system');

    case 'setDiscoverable':
      return log(
        { ...state, discoverable: action.value },
        action.value ? 'Turned on sponsor discovery for your anonymised profile' : 'Turned off sponsor discovery',
        'profile',
      );

    case 'agentDecision':
      return { ...state, agentDecisions: { ...state.agentDecisions, [action.id]: action.decision } };

    case 'addSponsorAward': {
      const id = `sponsor-${action.applicationId}`;
      if (state.fundingSources.some((s) => s.id === id)) return state;
      return log(
        {
          ...state,
          fundingSources: [...state.fundingSources, { id, label: action.label, kind: 'bursary', amount: action.amount }],
        },
        `Accepted ${action.label} (${formatZAR(action.amount)}, paid to your institution)`,
        'funding',
      );
    }

    case 'log':
      return log(state, action.text, action.kind);

    case 'addDocument': {
      // One current document per kind: a new upload replaces the old one.
      const documents = [action.document, ...(state.documents ?? []).filter((d) => d.kind !== action.document.kind)];
      let next: StudentState = { ...state, documents };
      // Keep the onboarding document checklist and journey tasks in step.
      const docKey = ({ 'id-copy': 'id-copy', 'latest-results': 'latest-results', 'income-proof': 'income-proof' } as const)[
        action.document.kind as 'id-copy' | 'latest-results' | 'income-proof'
      ];
      if (docKey && action.document.check.status !== 'failed') {
        const taskId = { 'id-copy': 't-doc-id', 'latest-results': 't-doc-results', 'income-proof': 't-doc-income' }[docKey];
        next = {
          ...next,
          profile: { ...next.profile, documentsReady: [...new Set([...next.profile.documentsReady, docKey])] },
          taskStatus: { ...next.taskStatus, [taskId]: 'completed' },
          taskHistory: [...next.taskHistory, { taskId, status: 'completed', at: new Date().toISOString() }],
        };
      }
      return log(next, `Added ${action.document.fileName} to your document vault`, 'profile');
    }

    case 'removeDocument':
      return { ...state, documents: (state.documents ?? []).filter((d) => d.id !== action.id) };

    case 'setDocumentIssuer': {
      const doc = (state.documents ?? []).find((d) => d.id === action.id);
      if (!doc) return state;
      let next: StudentState = { ...state, documents: state.documents.map((d) => (d.id === action.id ? { ...d, issuer: action.status } : d)) };
      // A confirmed admission letter is proof of enrolment.
      if (doc.kind === 'admission-letter' && action.status === 'verified') {
        next = {
          ...next,
          verification: { ...next.verification, enrolment: { status: 'verified', updatedAt: new Date().toISOString(), note: 'Admission letter confirmed by the institution' } },
        };
      }
      if (doc.kind === 'latest-results' && action.status === 'verified') {
        next = { ...next, verification: { ...next.verification, results: { status: 'verified', updatedAt: new Date().toISOString(), note: 'Results confirmed by the school' } } };
      }
      return action.status === 'verified' ? log(next, `${doc.fileName} confirmed by the issuer`, 'profile') : next;
    }

    default:
      return state;
  }
}
