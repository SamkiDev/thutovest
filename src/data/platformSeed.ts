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

export const DEMO_ACCOUNTS = {
  student: { email: `thando@${BRAND.demoDomain}`, password: 'Demo#2026', userId: 'stu-thando' },
  sponsor: { email: `funding@ridgeline.demo`, password: 'Demo#2026', userId: DEMO_SPONSOR_ID },
};

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
      description: 'Covers tuition and accommodation for first-year computing and engineering students. Includes a paid December vacation-work week.',
      budget: 600000,
      maxPerStudent: 60000,
      places: 10,
      fields: ['computing', 'engineering'],
      provinces: 'all',
      incomeBands: ['under-350k', '350k-600k'],
      minTrust: 1,
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
      closesOn: addDays(start, 52),
      status: 'open',
      createdAt: hoursAgo(24 * 9),
    },
    {
      id: 'fund-community-first',
      sponsorId: 'sp-community',
      name: 'First-Generation Scholarship',
      description: 'For students who are the first in their family to study after school. Any field, any public institution.',
      budget: 240000,
      maxPerStudent: 20000,
      places: 12,
      fields: 'all',
      provinces: 'all',
      incomeBands: 'all',
      minTrust: 2,
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
    results: [{ term: 'Semester 1, 2026', average: 71, creditsPassed: 60, creditsTaken: 64 }],
  },
  {
    id: 'stu-zanele', firstName: 'Zanele', province: 'Eastern Cape', field: 'computing', educationStage: 'first-year', institutionId: 'nmu', householdIncome: 'under-350k', apsEstimate: 30, isAdult: true, trust: 3, totalCost: 86000, gap: 0, onTimeRate: 0.9, tasksCompleted: 17, progressRatio: 0.85,
    results: [{ term: 'Semester 1, 2026', average: 64, creditsPassed: 56, creditsTaken: 64 }],
  },
];

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
    a('app-zanele', 'fund-ridge-dev', 'stu-zanele', 'paid', { amount: 38000, paymentReference: 'RDG-26-0419' }, 24 * 198),
    a('app-lerato', 'fund-ridge-dev', 'stu-lerato', 'offered', { amount: 58000 }, 20),
    a('app-sipho', 'fund-ridge-dev', 'stu-sipho', 'shortlisted', { initiatedBy: 'student' }, 30),
    a('app-ayesha', 'fund-ridge-dev', 'stu-ayesha', 'accepted', {
      initiatedBy: 'student',
      amount: 36800,
      agreement: { signedName: 'Ayesha (surname on file)', signedAt: hoursAgo(30), terms: [] },
    }, 5),
    a('app-thando-quick', 'fund-quick', 'stu-thando', 'declined-by-sponsor', { declineReason: 'Sponsor suspended for requesting a fee' }, 72),
  ];
}

function messages(): Message[] {
  return [
    { id: 'm-q1', applicationId: 'app-thando-quick', from: 'system', text: 'QuickBursary SA started a conversation about the Instant Study Grant.', at: hoursAgo(73) },
    {
      id: 'm-q2',
      applicationId: 'app-thando-quick',
      from: 'sponsor',
      text: 'Congratulations Thando! You qualify for R50,000. To release it, pay a R350 admin fee by eWallet to 082 555 0199 today.',
      at: hoursAgo(72),
      blocked: true,
      flags: [
        { kind: 'payment-request', label: 'Request for payment' },
        { kind: 'contact-details', label: 'Phone number' },
      ],
    },
    {
      id: 'm-q3',
      applicationId: 'app-thando-quick',
      from: 'system',
      text: 'We blocked a message that asked you to pay a fee. Real sponsors never ask for money. QuickBursary SA has been suspended while we review it. You did nothing wrong.',
      at: hoursAgo(72),
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
    { id: 'e1', at: hoursAgo(72), audience: 'student', studentId: 'stu-thando', text: 'Blocked a fee request from QuickBursary SA and suspended the sender', kind: 'safety' },
    { id: 'e2', at: hoursAgo(20), audience: 'sponsor', sponsorId: DEMO_SPONSOR_ID, text: 'Offer of R58,000 sent to Lerato', kind: 'offer' },
    { id: 'e3', at: hoursAgo(6), audience: 'sponsor', sponsorId: DEMO_SPONSOR_ID, text: 'Ayesha shared her admission letter and results', kind: 'document' },
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
