import type { DocumentKind, DocumentShare, VerificationStatus, CandidateProfile, Fund, FundApplication, Message, PlatformEvent, PlatformState, SponsorDecision, SponsorOrg } from '../types';
import { addDays, todayISO } from '../utils/dates';
import { BRAND } from '../config/brand';

/**
 * DEMONSTRATION MARKETPLACE. Every sponsor, fund and student below is
 * fictional. Registration numbers follow real formats but are invented.
 */

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const verified = { status: 'verified' as const, updatedAt: hoursAgo(24 * 20) };

export const DEMO_SPONSOR_ID = 'sp-ridgeline';
export const SCAM_SPONSOR_ID = 'sp-quickbursary';
export const RESHOKETSWE_ID = 'sp-reshoketswe';

export const DEMO_ACCOUNTS = {
  student: { email: `tatenda@${BRAND.demoDomain}`, password: 'Demo#2026', userId: 'stu-tatenda' },
  sponsor: { email: `funding@ridgeline.demo`, password: 'Demo#2026', userId: DEMO_SPONSOR_ID },
};

/** One login per judge, each starting from the same story as Tatenda but with a plan of their own. */
export const JUDGE_ACCOUNTS = [
  { email: `judge1@${BRAND.demoDomain}`, password: 'Demo#2026', userId: 'stu-judge1', firstName: 'Lwazi', guardian: 'Zodwa', relationship: 'Mother' },
  { email: `judge2@${BRAND.demoDomain}`, password: 'Demo#2026', userId: 'stu-judge2', firstName: 'Bongani', guardian: 'Themba', relationship: 'Father' },
  { email: `judge3@${BRAND.demoDomain}`, password: 'Demo#2026', userId: 'stu-judge3', firstName: 'Karabo', guardian: 'Dineo', relationship: 'Mother' },
  { email: `judge4@${BRAND.demoDomain}`, password: 'Demo#2026', userId: 'stu-judge4', firstName: 'Palesa', guardian: 'Lindiwe', relationship: 'Mother' },
  { email: `judge5@${BRAND.demoDomain}`, password: 'Demo#2026', userId: 'stu-judge5', firstName: 'Thabo', guardian: 'Sibusiso', relationship: 'Father' },
];

/** Every demo student login: Tatenda first, then the judges. */
export const DEMO_STUDENTS = [
  { ...DEMO_ACCOUNTS.student, firstName: 'Tatenda', guardian: 'Nomsa', relationship: 'Mother' },
  ...JUDGE_ACCOUNTS,
];

export const demoStudent = (userId: string | undefined) => DEMO_STUDENTS.find((d) => d.userId === userId);

/** Seed ids for a demo student's records, e.g. app-tatenda-quick. */
const short = (userId: string) => userId.replace(/^stu-/, '');

function sponsors(): SponsorOrg[] {
  return [
    {
      id: DEMO_SPONSOR_ID,
      name: 'Ridgeline Technologies',
      type: 'company',
      registrationNumber: '2016/412233/07',
      contactName: 'Anele',
      about: 'A fictional Johannesburg software company funding the next generation of South African developers and engineers.',
      verification: { organisation: verified, representative: verified, bank: verified },
      status: 'active',
      isDemo: true,
      createdAt: hoursAgo(24 * 120),
    },
    {
      id: RESHOKETSWE_ID,
      name: 'Reshoketswe Foundation',
      type: 'trust',
      registrationNumber: 'IT0417/2019',
      contactName: 'Reshoketswe',
      about: 'A fictional trust funding students with disabilities, including assistive devices and campus support.',
      verification: { organisation: verified, representative: verified, bank: verified },
      status: 'active',
      isDemo: true,
      createdAt: hoursAgo(24 * 60),
    },
    {
      id: 'sp-community',
      name: 'Community Futures Trust',
      type: 'trust',
      registrationNumber: 'IT2210/2012',
      contactName: 'Busisiwe',
      about: 'A fictional community trust supporting first-generation students in any field.',
      verification: { organisation: verified, representative: verified, bank: verified },
      status: 'active',
      isDemo: true,
      createdAt: hoursAgo(24 * 300),
    },
    {
      id: SCAM_SPONSOR_ID,
      name: 'QuickBursary SA',
      type: 'company',
      registrationNumber: '2025/889104/07',
      contactName: 'Mr K.',
      about: 'Fictional example of a fraudulent sponsor, included to demonstrate scam protection.',
      verification: {
        organisation: { status: 'verified', updatedAt: hoursAgo(80) },
        representative: { status: 'pending', updatedAt: hoursAgo(80) },
        bank: { status: 'not-started' },
      },
      status: 'suspended',
      suspendedReason: 'Asked a student to pay an “admin fee”. Account suspended pending review.',
      isDemo: true,
      createdAt: hoursAgo(90),
    },
  ];
}

function funds(start: string): Fund[] {
  return [
    {
      id: 'fund-ridge-dev',
      sponsorId: DEMO_SPONSOR_ID,
      name: 'Future Developers Bursary 2027',
      description: 'Tuition and accommodation for first-year computing and engineering. Paid December work week.',
      budget: 600000,
      maxPerStudent: 60000,
      places: 10,
      fields: ['computing', 'engineering'],
      provinces: 'all',
      incomeBands: ['under-350k', '350k-600k'],
      minTrust: 1,
      terms: { covers: ['tuition', 'accommodation'], minPassMark: 60, workBackYears: 1 },
      closesOn: addDays(start, 30),
      status: 'open',
      createdAt: hoursAgo(24 * 21),
    },
    {
      id: 'fund-ridge-eng',
      sponsorId: DEMO_SPONSOR_ID,
      name: 'Engineering Access Fund',
      description: 'Top-up awards for engineering students from Gauteng, Limpopo and Mpumalanga.',
      budget: 270000,
      maxPerStudent: 45000,
      places: 6,
      fields: ['engineering'],
      provinces: ['Gauteng', 'Limpopo', 'Mpumalanga'],
      incomeBands: 'all',
      minTrust: 2,
      terms: { covers: ['tuition'], minPassMark: 55 },
      closesOn: addDays(start, 52),
      status: 'open',
      createdAt: hoursAgo(24 * 9),
    },
    {
      id: 'fund-reshoketswe',
      sponsorId: RESHOKETSWE_ID,
      name: 'Reshoketswe Bursary for Students with Disabilities',
      description: 'Tuition, assistive devices and support for students with disabilities. Any field.',
      budget: 400000,
      maxPerStudent: 50000,
      places: 10,
      fields: 'all',
      provinces: 'all',
      incomeBands: ['under-350k', '350k-600k'],
      minTrust: 2,
      terms: { covers: 'all', minPassMark: 50 },
      disabilityOnly: true,
      closesOn: addDays(start, 38),
      status: 'open',
      createdAt: hoursAgo(24 * 14),
    },
    {
      id: 'fund-community-first',
      sponsorId: 'sp-community',
      name: 'First-Generation Scholarship',
      description: 'First in your family to study after school. Any field.',
      budget: 240000,
      maxPerStudent: 20000,
      places: 12,
      fields: 'all',
      provinces: 'all',
      incomeBands: 'all',
      minTrust: 2,
      terms: { covers: ['books', 'transport', 'other'] },
      closesOn: addDays(start, 45),
      status: 'open',
      createdAt: hoursAgo(24 * 30),
    },
    {
      id: 'fund-quick',
      sponsorId: SCAM_SPONSOR_ID,
      name: 'Instant Study Grant',
      description: 'Suspended listing.',
      budget: 500000,
      maxPerStudent: 50000,
      places: 10,
      fields: 'all',
      provinces: 'all',
      incomeBands: 'all',
      minTrust: 0,
      closesOn: addDays(start, 5),
      status: 'closed',
      createdAt: hoursAgo(90),
    },
  ];
}

type PoolSeed = Omit<CandidateProfile, 'checks' | 'identifiedFunding' | 'isLive' | 'discoverable'> & { discoverable?: boolean };

const POOL: PoolSeed[] = [
  { id: 'stu-lerato', firstName: 'Lerato', province: 'Limpopo', field: 'computing', educationStage: 'grade12', institutionId: 'tut', householdIncome: 'under-350k', apsEstimate: 34, isAdult: true, trust: 3, totalCost: 98000, gap: 58000, onTimeRate: 0.92, tasksCompleted: 14, progressRatio: 0.62 },
  { id: 'stu-sipho', firstName: 'Sipho', province: 'KwaZulu-Natal', field: 'engineering', educationStage: 'gap-year', institutionId: 'dut', householdIncome: 'under-350k', apsEstimate: 30, isAdult: true, trust: 2, totalCost: 89000, gap: 41500, onTimeRate: 0.75, tasksCompleted: 9, progressRatio: 0.45 },
  { id: 'stu-ayesha', firstName: 'Ayesha', province: 'Western Cape', field: 'computing', educationStage: 'grade12', institutionId: 'cput', householdIncome: '350k-600k', apsEstimate: 36, isAdult: true, trust: 2, totalCost: 92000, gap: 36800, onTimeRate: 0.88, tasksCompleted: 12, progressRatio: 0.55 },
  { id: 'stu-amahle', firstName: 'Amahle', province: 'KwaZulu-Natal', field: 'computing', educationStage: 'grade12', institutionId: 'ukzn', householdIncome: 'under-350k', apsEstimate: 33, isAdult: false, trust: 3, totalCost: 101000, gap: 47200, onTimeRate: 0.83, tasksCompleted: 11, progressRatio: 0.5 },
  { id: 'stu-pieter', firstName: 'Pieter', province: 'Northern Cape', field: 'engineering', educationStage: 'grade12', institutionId: 'sun', householdIncome: '350k-600k', apsEstimate: 37, isAdult: true, trust: 2, totalCost: 128000, gap: 86000, onTimeRate: 0.6, tasksCompleted: 6, progressRatio: 0.3 },
  { id: 'stu-mpho', firstName: 'Mpho', province: 'Gauteng', field: 'commerce', educationStage: 'grade12', institutionId: 'uj', householdIncome: 'under-350k', apsEstimate: 29, isAdult: true, trust: 2, totalCost: 84000, gap: 33000, onTimeRate: 0.8, tasksCompleted: 10, progressRatio: 0.48 },
  { id: 'stu-naledi', firstName: 'Naledi', province: 'Free State', field: 'engineering', educationStage: 'grade12', institutionId: 'ufs', householdIncome: 'prefer-not', apsEstimate: 31, isAdult: false, trust: 1, totalCost: 96000, gap: 70000, onTimeRate: null, tasksCompleted: 2, progressRatio: 0.12 },
  { id: 'stu-themba', firstName: 'Themba', province: 'Mpumalanga', field: 'computing', educationStage: 'grade12', institutionId: 'tut', householdIncome: 'under-350k', apsEstimate: 27, isAdult: true, trust: 0, totalCost: 88000, gap: 64000, onTimeRate: 0.5, tasksCompleted: 3, progressRatio: 0.15, discoverable: false },
  {
    id: 'stu-kagiso', firstName: 'Kagiso', province: 'North West', field: 'computing', educationStage: 'first-year', institutionId: 'up', householdIncome: 'under-350k', apsEstimate: 35, isAdult: true, trust: 3, totalCost: 104000, gap: 0, onTimeRate: 0.95, tasksCompleted: 19, progressRatio: 0.9,
    results: [
      { term: 'Semester 1, 2026', average: 71, creditsPassed: 60, creditsTaken: 64, subjects: mods(['Programming 1', 78], ['Mathematics 1', 64], ['Information Systems 1', 70], ['Statistics 1', 72]) },
      { term: 'Semester 2 tests, 2026', average: 73, creditsPassed: 32, creditsTaken: 32, subjects: mods(['Programming 2', 80], ['Mathematics 1B', 66], ['Databases', 72], ['Statistics 1B', 74]) },
    ],
  },
  {
    id: 'stu-zanele', firstName: 'Zanele', province: 'Eastern Cape', field: 'computing', educationStage: 'first-year', institutionId: 'nmu', householdIncome: 'under-350k', apsEstimate: 30, isAdult: true, trust: 3, totalCost: 86000, gap: 0, onTimeRate: 0.9, tasksCompleted: 17, progressRatio: 0.85,
    // Slipping below the Developer Bursary's 60% pass mark: the early-warning example.
    results: [
      { term: 'Semester 1, 2026', average: 64, creditsPassed: 56, creditsTaken: 64, subjects: mods(['Programming 1', 72], ['Discrete Mathematics', 58], ['Computer Systems', 66], ['Statistics 1', 60]) },
      { term: 'Semester 2 tests, 2026', average: 56, creditsPassed: 20, creditsTaken: 32, subjects: mods(['Data Structures and Algorithms', 44], ['Discrete Mathematics 2', 55], ['Computer Systems 2', 66], ['Statistics 1B', 59]) },
    ],
  },
];

function mods(...list: [string, number][]) {
  return list.map(([subject, mark]) => ({ subject, mark }));
}

function pool(): CandidateProfile[] {
  return POOL.map((p) => {
    const v = (cond: boolean): VerificationStatus => (cond ? 'verified' : 'not-started');
    return {
      ...p,
      discoverable: p.discoverable ?? true,
      isLive: false,
      identifiedFunding: p.totalCost - p.gap,
      checks: {
        identity: v(p.trust >= 1),
        guardian: p.isAdult ? 'not-started' : v(p.trust >= 2 || p.id === 'stu-naledi'),
        enrolment: v(p.trust >= 2),
        results: v(p.trust >= 3),
        income: v(p.trust >= 3),
      },
    };
  });
}

/** The blocked fee request every demo student starts with, so the safety story is there from the first sign-in. */
function scamApplication(studentId: string): FundApplication {
  return {
    id: `app-${short(studentId)}-quick`,
    fundId: 'fund-quick',
    studentId,
    status: 'declined-by-sponsor',
    initiatedBy: 'sponsor',
    createdAt: hoursAgo(96),
    updatedAt: hoursAgo(72),
    declineReason: 'Sponsor suspended for requesting a fee',
  };
}

function scamMessages(studentId: string, firstName: string): Message[] {
  const applicationId = `app-${short(studentId)}-quick`;
  const id = (n: number) => (studentId === DEMO_ACCOUNTS.student.userId ? `m-q${n}` : `m-q${n}-${short(studentId)}`);
  return [
    { id: id(1), applicationId, from: 'system', text: 'QuickBursary SA started a conversation about the Instant Study Grant.', at: hoursAgo(73) },
    {
      id: id(2),
      applicationId,
      from: 'sponsor',
      text: `Congratulations ${firstName}! You qualify for R50,000. To release it, pay a R350 admin fee by eWallet to 082 555 0199 today.`,
      at: hoursAgo(72),
      blocked: true,
      flags: [
        { kind: 'payment-request', label: 'Request for payment' },
        { kind: 'contact-details', label: 'Phone number' },
      ],
    },
    {
      id: id(3),
      applicationId,
      from: 'system',
      text: 'We blocked a fee request. Real sponsors never ask for money. You did nothing wrong.',
      at: hoursAgo(72),
    },
  ];
}

function applications(): FundApplication[] {
  const a = (id: string, fundId: string, studentId: string, status: FundApplication['status'], extra: Partial<FundApplication> = {}, h = 48): FundApplication => ({
    id,
    fundId,
    studentId,
    status,
    initiatedBy: 'sponsor',
    createdAt: hoursAgo(h + 24),
    updatedAt: hoursAgo(h),
    ...extra,
  });
  return [
    a('app-kagiso', 'fund-ridge-dev', 'stu-kagiso', 'paid', { amount: 45000, paymentReference: 'RDG-26-0412' }, 24 * 200),
    a('app-zanele', 'fund-ridge-dev', 'stu-zanele', 'paid', {
      amount: 38000,
      paymentReference: 'RDG-26-0419',
      tutorRequests: [
        {
          id: 'tut-zanele',
          subject: 'Data Structures and Algorithms',
          note: 'I failed the second test. A tutor once a week before exams would really help.',
          at: hoursAgo(10),
          status: 'requested',
        },
      ],
    }, 24 * 198),
    a('app-lerato', 'fund-ridge-dev', 'stu-lerato', 'offered', { amount: 58000 }, 20),
    a('app-sipho', 'fund-ridge-dev', 'stu-sipho', 'shortlisted', { initiatedBy: 'student' }, 30),
    a('app-ayesha', 'fund-ridge-dev', 'stu-ayesha', 'accepted', {
      initiatedBy: 'student',
      amount: 36800,
      agreement: { signedName: 'Ayesha (surname on file)', signedAt: hoursAgo(30), terms: [] },
    }, 5),
    ...DEMO_STUDENTS.map((d) => scamApplication(d.userId)),
  ];
}

function messages(): Message[] {
  return [
    ...DEMO_STUDENTS.flatMap((d) => scamMessages(d.userId, d.firstName)),
    {
      id: 'm-z1',
      applicationId: 'app-zanele',
      from: 'student',
      text: 'Tutor request: Data Structures and Algorithms. I failed the second test. A tutor once a week before exams would really help.',
      at: hoursAgo(10),
    },
    { id: 'm-a1', applicationId: 'app-ayesha', from: 'system', text: 'Ayesha accepted and signed the funding agreement in the app. Next: documents.', at: hoursAgo(30) },
    { id: 'm-a2', applicationId: 'app-ayesha', from: 'student', text: 'I’ve shared my admission letter and June results. My mom is getting the SASSA letter this week.', at: hoursAgo(6) },
    { id: 'm-l1', applicationId: 'app-lerato', from: 'sponsor', text: 'Hi Lerato, we’d like to offer you R58,000 towards your BSc at TUT. The full amount is paid to your fee account.', at: hoursAgo(20) },
  ];
}

function snap(
  kind: DocumentKind,
  fileName: string,
  extracted: { label: string; value: string }[],
  opts: { warning?: string; issuer?: VerificationStatus; h?: number } = {},
): NonNullable<DocumentShare['snapshot']> {
  const findings = [
    { label: 'File type', ok: true, detail: 'PDF or photo' },
    { label: 'Readability', ok: true, detail: 'Text is readable' },
    { label: 'Document type', ok: true, detail: 'Recognised automatically' },
    { label: 'Name matches the profile', ok: true },
    ...(opts.warning ? [{ label: 'Needs a look', ok: false, detail: opts.warning, severity: 'warning' as const }] : []),
    { label: 'Signs of editing', ok: true, detail: 'None found' },
  ];
  return {
    documentId: `vault-${fileName}`,
    kind,
    fileName,
    mimeType: 'application/pdf',
    size: 200_000,
    uploadedAt: hoursAgo(opts.h ?? 8),
    isSample: true,
    issuer: opts.issuer ?? 'not-started',
    check: { status: opts.warning ? 'warning' : 'passed', findings, extracted, detectedKind: kind, checkedAt: hoursAgo(opts.h ?? 8) },
  };
}

function documents(start: string): DocumentShare[] {
  const share = (id: string, applicationId: string, kind: DocumentKind, status: DocumentShare['status'], snapshot?: DocumentShare['snapshot'], h = 8): DocumentShare => ({
    id,
    applicationId,
    kind,
    required: true,
    status,
    requestedAt: hoursAgo(h + 20),
    dueOn: addDays(start, 9),
    sharedAt: snapshot ? hoursAgo(h) : undefined,
    reviewedAt: status === 'approved' ? hoursAgo(h - 1) : undefined,
    snapshot,
  });
  return [
    share('d-ay-adm', 'app-ayesha', 'admission-letter', 'shared', snap('admission-letter', 'CPUT_admission_Ayesha.pdf', [
      { label: 'Institution', value: 'Cape Peninsula University of Technology' },
      { label: 'Qualification', value: 'Diploma in ICT: Applications Development' },
      { label: 'Admission type', value: 'Provisional, subject to final NSC results' },
    ], { warning: 'Provisional offer. Ask for the final letter after NSC results if needed.', h: 6 }), 6),
    share('d-ay-res', 'app-ayesha', 'latest-results', 'shared', snap('latest-results', 'Grade12_June_results_Ayesha.pdf', [
      { label: 'Results', value: 'Grade 12 June examination' },
      { label: 'Estimated APS', value: '36' },
    ], { issuer: 'verified', h: 6 }), 6),
    share('d-ay-inc', 'app-ayesha', 'income-proof', 'requested'),
    share('d-le-adm', 'app-lerato', 'admission-letter', 'requested'),
    share('d-ka-adm', 'app-kagiso', 'admission-letter', 'approved', snap('admission-letter', 'UP_admission_Kagiso.pdf', [{ label: 'Institution', value: 'University of Pretoria' }], { issuer: 'verified', h: 24 * 200 }), 24 * 200),
    share('d-ka-sem', 'app-kagiso', 'semester-results', 'approved', snap('semester-results', 'UP_semester1_record_Kagiso.pdf', [{ label: 'Average', value: '71%' }, { label: 'Credits', value: '60 of 64' }], { issuer: 'verified', h: 24 * 60 }), 24 * 60),
    share('d-za-adm', 'app-zanele', 'admission-letter', 'approved', snap('admission-letter', 'NMU_admission_Zanele.pdf', [{ label: 'Institution', value: 'Nelson Mandela University' }], { issuer: 'verified', h: 24 * 198 }), 24 * 198),
    share('d-za-sem', 'app-zanele', 'semester-results', 'approved', snap('semester-results', 'NMU_semester1_record_Zanele.pdf', [{ label: 'Average', value: '64%' }, { label: 'Credits', value: '56 of 64' }], { issuer: 'verified', h: 24 * 58 }), 24 * 58),
  ];
}

function decisions(): Record<string, SponsorDecision[]> {
  const d = (studentId: string, outcome: SponsorDecision['outcome'], reason?: string, h = 48): SponsorDecision => ({
    studentId,
    fundId: 'fund-ridge-dev',
    outcome,
    reason,
    at: hoursAgo(h),
  });
  return {
    [DEMO_SPONSOR_ID]: [
      d('stu-kagiso', 'positive', undefined, 24 * 201),
      d('stu-zanele', 'positive', undefined, 24 * 199),
      d('stu-lerato', 'positive', undefined, 21),
      d('stu-sipho', 'positive', undefined, 30),
      d('stu-pieter', 'negative', 'Gap is larger than one award can cover', 40),
      d('stu-mpho', 'negative', 'Field is outside this fund’s focus', 44),
    ],
  };
}

function events(): PlatformEvent[] {
  return [
    ...DEMO_STUDENTS.map((d, i): PlatformEvent => ({
      id: i === 0 ? 'e1' : `e1-${short(d.userId)}`,
      at: hoursAgo(72),
      audience: 'student',
      studentId: d.userId,
      text: 'Blocked a fee request from QuickBursary SA and suspended the sender',
      kind: 'safety',
    })),
    { id: 'e2', at: hoursAgo(20), audience: 'sponsor', sponsorId: DEMO_SPONSOR_ID, text: 'Offer of R58,000 sent to Lerato', kind: 'offer' },
    { id: 'e3', at: hoursAgo(6), audience: 'sponsor', sponsorId: DEMO_SPONSOR_ID, text: 'Ayesha shared her admission letter and results', kind: 'document' },
    { id: 'e4', at: hoursAgo(10), audience: 'sponsor', sponsorId: DEMO_SPONSOR_ID, text: 'Zanele asked for a tutor in Data Structures and Algorithms', kind: 'message' },
  ];
}

export function createPlatformSeed(start = todayISO()): PlatformState {
  return {
    version: 1,
    sponsors: sponsors(),
    funds: funds(start),
    pool: pool(),
    applications: applications(),
    messages: messages(),
    documents: documents(start),
    decisions: decisions(),
    events: events(),
  };
}
