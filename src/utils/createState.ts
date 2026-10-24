import type { StudentProfile, StudentState, TaskEvent, TaskStatus } from '../types';
import { FUNDING_OPPORTUNITIES } from '../data/fundingOpportunities';
import { TASKS } from '../data/journey';
import { estimateCosts } from './funding';
import { addDays, todayISO } from './dates';
import { matchAll } from './matching';
import { emptyVerification } from './trust';
import { DEMO_STUDENTS, UNI_ACCOUNT, UNI_AWARD, UNI_MARKS, demoStudent } from '../data/platformSeed';
import { guardianConsentDocument, guardianConsentStatement } from '../platform/guardianRules';

export const BUDGET_SOURCE_ID = 'src-own';

export function makeId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Turns onboarding answers into starting task statuses. */
export function seedTaskStatus(profile: StudentProfile): Record<string, TaskStatus> {
  const status: Record<string, TaskStatus> = {};
  for (const t of TASKS) {
    if (t.document && profile.documentsReady.includes(t.document)) status[t.id] = 'completed';
  }
  switch (profile.applicationProgress) {
    case 'researching':
      status['t-shortlist'] = 'in-progress';
      break;
    case 'started':
      status['t-shortlist'] = 'completed';
      status['t-app-first'] = 'in-progress';
      break;
    case 'submitted':
      status['t-shortlist'] = 'completed';
      status['t-aps'] = 'completed';
      status['t-app-first'] = 'completed';
      break;
    case 'accepted':
      for (const id of ['t-shortlist', 't-aps', 't-app-first', 't-app-backup', 't-track', 't-accept']) status[id] = 'completed';
      break;
    default:
      break;
  }
  return status;
}

export function createStateFromProfile(profile: StudentProfile, isDemoStudent = false, id = makeId('stu')): StudentState {
  const now = new Date().toISOString();
  const topMatches = matchAll(profile).filter((m) => m.option.field === profile.field).slice(0, 2);
  const taskStatus = seedTaskStatus(profile);
  return {
    version: 1,
    id,
    onboarded: true,
    isDemoStudent,
    demoStart: todayISO(),
    profile,
    costs: estimateCosts(profile),
    costsCustomised: false,
    fundingSources:
      profile.annualBudget > 0
        ? [{ id: BUDGET_SOURCE_ID, label: 'Family / own contribution', kind: 'family', amount: profile.annualBudget }]
        : [],
    opportunityStatus: Object.fromEntries(FUNDING_OPPORTUNITIES.map((o) => [o.id, 'not-started'])),
    awardedAmounts: {},
    taskStatus,
    savedOptionIds: profile.applicationProgress === 'not-started' ? [] : topMatches.map((m) => m.option.id),
    compareIds: [],
    activity: [{ id: makeId('act'), at: now, text: 'Built your personal pathway from your answers', kind: 'system' }],
    taskHistory: Object.entries(taskStatus).map(([taskId, status]) => ({ taskId, status, at: now })),
    verification: emptyVerification(),
    discoverable: false,
    agentDecisions: {},
    documents: [],
  };
}

/** Tatenda — the coherent fictional student used throughout the demo. */
export const DEMO_PROFILE: StudentProfile = {
  firstName: 'Tatenda',
  province: 'Gauteng',
  educationStage: 'grade12',
  field: 'computing',
  studyMode: 'contact',
  preferredInstitutionIds: ['uj', 'wits', 'up'],
  apsEstimate: 32,
  annualBudget: 18000,
  fundingNeed: 'yes',
  householdIncome: 'under-350k',
  livingArrangement: 'residence',
  applicationProgress: 'started',
  documentsReady: ['id-copy'],
  isAdult: false,
};

/** A timestamp n days ago at a given local hour — Tatenda mostly works on weekday evenings. */
function daysAgoAt(days: number, hour: number, minute = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** The demo story for Tatenda, or for a judge login (same story, the judge's own name and plan). */
export function createDemoState(userId?: string): StudentState {
  if (userId === UNI_ACCOUNT.userId) return createUniDemoState();
  const who = demoStudent(userId) ?? DEMO_STUDENTS[0];
  const name = who.firstName;
  const consent = guardianConsentStatement(name, who.guardian, who.relationship);
  const base = createStateFromProfile({ ...DEMO_PROFILE, firstName: name }, true, who.userId);
  const start = base.demoStart;
  const history: TaskEvent[] = [
    { taskId: 't-shortlist', status: 'in-progress', at: daysAgoAt(19, 19, 40) },
    { taskId: 't-aps', status: 'completed', at: daysAgoAt(16, 20, 5) },
    { taskId: 't-fund-review', status: 'in-progress', at: daysAgoAt(12, 19, 20) },
    { taskId: 't-doc-id', status: 'completed', at: daysAgoAt(2, 18, 45), dueDate: addDays(start, 6) },
    { taskId: 't-fund-review', status: 'completed', at: daysAgoAt(1, 20, 30) },
    { taskId: 't-app-first', status: 'in-progress', at: daysAgoAt(0, Math.min(new Date().getHours(), 19), 0) },
  ];
  return {
    ...base,
    costs: { tuition: 58200, accommodation: 42000, books: 6500, transport: 4800, other: 5400 },
    fundingSources: [
      { id: BUDGET_SOURCE_ID, label: 'Family contribution', kind: 'family', amount: 18000 },
      { id: 'src-holiday', label: 'Holiday job savings', kind: 'savings', amount: 6500 },
    ],
    taskStatus: {
      ...base.taskStatus,
      't-shortlist': 'in-progress',
      't-aps': 'completed',
      't-fund-review': 'completed',
    },
    savedOptionIds: ['uj-bsc-it', 'up-bsc-cs'],
    taskHistory: history,
    verification: {
      identity: { status: 'verified', updatedAt: daysAgoAt(9, 19), note: 'Document, face match and liveness passed' },
      guardian: { status: 'verified', updatedAt: daysAgoAt(9, 20), note: 'Consent recorded' },
      enrolment: { status: 'not-started', note: 'Available once you receive an offer' },
      results: { status: 'not-started' },
      income: { status: 'not-started' },
      guardianName: who.guardian,
      guardianRelationship: who.relationship,
      guardianConsentText: consent,
      guardianConsentAt: daysAgoAt(9, 20),
    },
    discoverable: true,
    // Two terms already in, so the first new set of marks has something to compare with.
    marks: [
      {
        id: 'marks-term1',
        term: 'Term 1, 2026',
        addedAt: daysAgoAt(150, 19),
        source: 'typed',
        subjects: [
          { subject: 'English Home Language', mark: 68 },
          { subject: 'Mathematics', mark: 66 },
          { subject: 'Physical Sciences', mark: 62 },
          { subject: 'Information Technology', mark: 75 },
          { subject: 'Life Sciences', mark: 64 },
          { subject: 'Sepedi First Additional Language', mark: 70 },
          { subject: 'Life Orientation', mark: 80 },
        ],
      },
      {
        id: 'marks-june',
        term: 'June exams, 2026',
        addedAt: daysAgoAt(110, 20),
        source: 'typed',
        subjects: [
          { subject: 'English Home Language', mark: 66 },
          { subject: 'Mathematics', mark: 61 },
          { subject: 'Physical Sciences', mark: 58 },
          { subject: 'Information Technology', mark: 77 },
          { subject: 'Life Sciences', mark: 63 },
          { subject: 'Sepedi First Additional Language', mark: 71 },
          { subject: 'Life Orientation', mark: 82 },
        ],
      },
    ],
    documents: [
      guardianConsentDocument(name, who.guardian, who.relationship, consent, daysAgoAt(9, 20)),
      {
        id: `doc-${who.userId.replace(/^stu-/, '')}-id`,
        kind: 'id-copy',
        fileName: `certified_ID_copy_${name}.pdf`,
        mimeType: 'application/pdf',
        size: 214_000,
        uploadedAt: daysAgoAt(2, 18, 44),
        isSample: true,
        issuer: 'not-started',
        check: {
          status: 'passed',
          detectedKind: 'id-copy',
          checkedAt: daysAgoAt(2, 18, 44),
          extracted: [
            { label: 'Name', value: `${name} (surname hidden)` },
            { label: 'ID number', value: 'Hidden. Never shown to sponsors' },
          ],
          findings: [
            { label: 'File type', ok: true, detail: 'PDF or photo' },
            { label: 'Readability', ok: true, detail: 'Text is readable' },
            { label: 'Document type', ok: true, detail: 'Recognised as certified copy of ID' },
            { label: 'Name matches your profile', ok: true },
            { label: 'Certified within 3 months', ok: true },
            { label: 'Signs of editing', ok: true, detail: 'None found' },
          ],
        },
      },
    ],
    activity: [
      { id: 'a1', at: daysAgoAt(0, 19, 5), text: 'Saved BSc Computer Science at UP to your shortlist', kind: 'explore' },
      { id: 'a2', at: daysAgoAt(0, 19, 0), text: 'Started your first-choice application', kind: 'task' },
      { id: 'a6', at: daysAgoAt(3, 9, 0), text: 'Blocked a fee request from QuickBursary SA and suspended the sender', kind: 'alert' },
      { id: 'a3', at: daysAgoAt(1, 20, 30), text: 'Reviewed your estimated funding gap', kind: 'funding' },
      { id: 'a4', at: daysAgoAt(2, 18, 45), text: 'Marked “Upload a certified copy of your ID” as done', kind: 'task' },
      { id: 'a7', at: daysAgoAt(9, 19, 30), text: 'Identity verified and guardian consent recorded', kind: 'profile' },
      { id: 'a5', at: daysAgoAt(19, 19, 40), text: 'Built your personal pathway from your answers', kind: 'system' },
    ],
  };
}

/** Demo plans saved before marks existed get the demo marks, so every judge sees the same starting story. */
export function upgradeDemoState(state: StudentState): StudentState {
  return state.isDemoStudent && state.marks === undefined ? { ...state, marks: createDemoState(state.id).marks } : state;
}

/** Nandi: a first-year at UJ whose Ridgeline bursary is already paid. Used to try marks, advice and tutor requests. */
export function createUniDemoState(): StudentState {
  const base = createStateFromProfile(
    {
      firstName: UNI_ACCOUNT.firstName,
      province: 'Gauteng',
      educationStage: 'first-year',
      field: 'computing',
      studyMode: 'contact',
      preferredInstitutionIds: ['uj'],
      apsEstimate: 34,
      annualBudget: 12000,
      fundingNeed: 'yes',
      householdIncome: 'under-350k',
      livingArrangement: 'residence',
      applicationProgress: 'accepted',
      documentsReady: ['id-copy', 'latest-results'],
      isAdult: true,
    },
    true,
    UNI_ACCOUNT.userId,
  );
  const verified = (days: number, note?: string) => ({ status: 'verified' as const, updatedAt: daysAgoAt(days, 19), note });
  // Applying, funding and registering are behind her. What is left: support this year, renewing funding and registering for second year.
  const stillOpen = new Set(['t-support', 't-academic', 't-funding-renew', 't-reregister']);
  const done = TASKS.map((t) => t.id).filter((id) => !stillOpen.has(id));
  return {
    ...base,
    taskStatus: { ...base.taskStatus, ...Object.fromEntries(done.map((id) => [id, 'completed' as TaskStatus])) },
    taskHistory: [...base.taskHistory.filter((e) => stillOpen.has(e.taskId)), ...done.map((taskId, i) => ({ taskId, status: 'completed' as TaskStatus, at: daysAgoAt(330 - i * 12, 19) }))],
    costs: { tuition: 58200, accommodation: 42000, books: 6500, transport: 3600, other: 5400 },
    fundingSources: [
      { id: BUDGET_SOURCE_ID, label: 'Family contribution', kind: 'family', amount: 12000 },
      { id: 'src-holiday', label: 'Holiday job savings', kind: 'savings', amount: 4000 },
      { id: 'sponsor-app-nandi', label: 'Future Developers Bursary 2027', kind: 'bursary', amount: UNI_AWARD },
    ],
    verification: {
      ...base.verification,
      identity: verified(210, 'Document, face match and liveness passed'),
      enrolment: verified(200, 'Admission letter confirmed by the institution'),
      results: verified(120, 'Semester 1 results confirmed'),
    },
    discoverable: true,
    marks: UNI_MARKS.map((m, i) => ({ id: `marks-s1-${i}`, ...m, addedAt: daysAgoAt(i ? 100 : 140, 20), source: 'typed' as const })),
    activity: [
      { id: 'n1', at: daysAgoAt(100, 20), text: 'Added Semester 1 exams, 2026 marks: average 66.3%, up 0.8 points', kind: 'profile' },
      { id: 'n2', at: daysAgoAt(190, 9), text: 'Ridgeline Technologies paid R55,000 to the University of Johannesburg', kind: 'funding' },
      { id: 'n3', at: daysAgoAt(205, 18), text: 'Accepted Future Developers Bursary 2027 (R55,000, paid to your institution)', kind: 'funding' },
    ],
  };
}
