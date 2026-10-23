/* ------------------------------------------------------------------
 * ThutoVest domain types
 * All data in this prototype is local demonstration data.
 * ------------------------------------------------------------------ */

export type EducationStage = 'grade11' | 'grade12' | 'gap-year' | 'first-year' | 'continuing';

export type StudyField =
  | 'computing'
  | 'engineering'
  | 'commerce'
  | 'health'
  | 'education'
  | 'law'
  | 'science'
  | 'humanities';

export type StudyMode = 'contact' | 'distance' | 'blended';
export type StudyModePreference = StudyMode | 'any';

export type InstitutionType = 'university' | 'university-of-technology' | 'tvet' | 'private';

export type Province =
  | 'Eastern Cape'
  | 'Free State'
  | 'Gauteng'
  | 'KwaZulu-Natal'
  | 'Limpopo'
  | 'Mpumalanga'
  | 'North West'
  | 'Northern Cape'
  | 'Western Cape';

export type ApplicationProgress = 'not-started' | 'researching' | 'started' | 'submitted' | 'accepted';

export type IncomeBand = 'under-350k' | '350k-600k' | 'over-600k' | 'prefer-not';

export type FundingNeed = 'yes' | 'unsure' | 'no';

export type LivingArrangement = 'home' | 'residence' | 'private';

export type DocumentKey = 'id-copy' | 'latest-results' | 'income-proof';

export interface StudentProfile {
  firstName: string;
  province: Province;
  educationStage: EducationStage;
  field: StudyField;
  studyMode: StudyModePreference;
  preferredInstitutionIds: string[];
  /** Estimated APS from the learner; optional. */
  apsEstimate: number | null;
  /** What the student/family can put towards study each year (ZAR). */
  annualBudget: number;
  fundingNeed: FundingNeed;
  householdIncome: IncomeBand;
  livingArrangement: LivingArrangement;
  applicationProgress: ApplicationProgress;
  documentsReady: DocumentKey[];
  /** Under-18s need a linked guardian before sponsors can contact them. */
  isAdult: boolean;
}

export interface CostBreakdown {
  tuition: number;
  accommodation: number;
  books: number;
  transport: number;
  other: number;
}

export type CostKey = keyof CostBreakdown;

export type FundingSourceKind = 'family' | 'savings' | 'bursary' | 'loan' | 'work' | 'other';

export interface FundingSource {
  id: string;
  label: string;
  kind: FundingSourceKind;
  amount: number;
}

export type OpportunityStatus = 'not-started' | 'preparing' | 'submitted' | 'awarded' | 'unsuccessful';

export type OpportunityType = 'Government bursary' | 'Bursary' | 'Loan' | 'Institutional aid' | 'Scholarship';

export interface FundingOpportunity {
  id: string;
  name: string;
  provider: string;
  type: OpportunityType;
  summary: string;
  eligibilitySummary: string;
  /** Present only when the link is an official, well-known provider URL. */
  officialUrl?: string;
  /** True for fictional records created purely for the demo. */
  isDemoRecord: boolean;
  /** Typical value is never shown as guaranteed; used as a planning placeholder only. */
  planningValueNote: string;
  /** Planning assumption for forecasts only — which cost lines it usually covers. */
  typicallyCovers: CostKey[];
  fields: StudyField[] | 'all';
  incomeBands: IncomeBand[] | 'all';
  institutionTypes: InstitutionType[] | 'all';
}

export type MatchLevel = 'possible' | 'check' | 'unlikely';

export interface OpportunityMatch {
  level: MatchLevel;
  label: string;
  reasons: string[];
}

export interface OfficialLink {
  label: string;
  url: string;
}

export interface Institution {
  id: string;
  name: string;
  shortName: string;
  city: string;
  province: Province;
  type: InstitutionType;
  website: string;
  /** Official application information or portal. */
  apply: OfficialLink;
  /** Official financial aid / bursaries page. */
  funding: OfficialLink;
  /** Applies through the Central Applications Office (KZN). */
  viaCAO?: boolean;
  extra?: OfficialLink[];
}

export type QualificationType = 'Degree' | 'Diploma' | 'Higher Certificate';

export interface StudyOption {
  id: string;
  qualification: string;
  institutionId: string;
  field: StudyField;
  type: QualificationType;
  nqfLevel: number;
  durationYears: number;
  modes: StudyMode[];
  /** Indicative first-year tuition for the demo (ZAR). Not an official fee. */
  indicativeTuition: number;
  /** Sample APS guide for the demo. Not an official admission requirement. */
  apsGuide: number;
  subjects: string;
  careers: string[];
  summary: string;
}

export type FitLevel = 'strong' | 'good' | 'partial';

export interface StudyMatch {
  option: StudyOption;
  institution: Institution;
  fit: FitLevel;
  score: number;
  reasons: string[];
  cautions: string[];
}

export type StageId = 'explore' | 'apply' | 'funding' | 'requirements' | 'registration' | 'year';

export interface JourneyStage {
  id: StageId;
  title: string;
  short: string;
  description: string;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type Priority = 'high' | 'medium' | 'low';
export type TaskKind = 'application' | 'document' | 'funding' | 'registration' | 'planning';

export interface TaskDefinition {
  id: string;
  stageId: StageId;
  title: string;
  description: string;
  priority: Priority;
  kind: TaskKind;
  /** Days after the demo start date. Demo dates only. */
  dueInDays?: number;
  action: { label: string; to: string };
  /** Linked onboarding document, if any. */
  document?: DocumentKey;
  /** Returns a reason string when the task does NOT apply to this profile. */
  hiddenWhen?: (p: StudentProfile) => string | null;
}

export interface JourneyTask extends TaskDefinition {
  status: TaskStatus;
  dueDate?: string;
  daysLeft?: number;
}

export type Severity = 'urgent' | 'soon' | 'watch';
export type AlertCategory = 'deadline' | 'document' | 'funding' | 'registration';

export interface RiskAlert {
  id: string;
  category: AlertCategory;
  severity: Severity;
  title: string;
  /** The specific item the alert is about. */
  subject: string;
  /** Why it matters to the student. */
  impact: string;
  /** Plain-language explanation of exactly why the rule fired. */
  why: string;
  recommendedAction: string;
  dueDate?: string;
  daysLeft?: number;
  /** When present, completing this task resolves the alert. */
  taskId?: string;
  route: string;
  routeLabel: string;
}

export interface ActivityItem {
  id: string;
  at: string;
  text: string;
  kind: 'task' | 'profile' | 'funding' | 'explore' | 'alert' | 'system';
}

export interface StudentState {
  version: 1;
  /** Platform-wide student id, e.g. stu-tatenda. */
  id: string;
  onboarded: boolean;
  isDemoStudent: boolean;
  /** ISO date that relative demo deadlines are counted from. */
  demoStart: string;
  profile: StudentProfile;
  costs: CostBreakdown;
  costsCustomised: boolean;
  fundingSources: FundingSource[];
  opportunityStatus: Record<string, OpportunityStatus>;
  awardedAmounts: Record<string, number>;
  taskStatus: Record<string, TaskStatus>;
  savedOptionIds: string[];
  compareIds: string[];
  activity: ActivityItem[];
  /** Every status change with a timestamp — the raw data the forecasts learn from. */
  taskHistory: TaskEvent[];
  verification: StudentVerification;
  /** Opt-in: verified sponsors may see an anonymised profile. */
  discoverable: boolean;
  /** The student's answers to agent proposals. */
  agentDecisions: Record<string, AgentDecision>;
  /** Private document vault. Nothing leaves it until the student shares a document. */
  documents: VaultDocument[];
  /** WhatsApp companion: read-and-remind only. Absent until the student links a number. */
  whatsapp?: WhatsAppLink;
}

export interface WhatsAppAlertPrefs {
  offers: boolean;
  documents: boolean;
  deadlines: boolean;
  payments: boolean;
  messages: boolean;
}

export interface WhatsAppLink {
  phone: string; // +27XXXXXXXXX
  consentAt: string;
  /** Waiting for the student to send the code from that number. */
  pending?: { code: string; expiresAt: string };
  linkedAt?: string;
  optedOut: boolean;
  alerts: WhatsAppAlertPrefs;
}

/* ---------- Documents ---------- */

export type DocumentKind =
  | 'admission-letter'
  | 'id-copy'
  | 'latest-results'
  | 'income-proof'
  | 'motivation-letter'
  | 'registration-proof'
  | 'semester-results';

export interface DocumentFinding {
  label: string;
  ok: boolean;
  detail?: string;
  severity?: 'warning' | 'error';
}

export interface DocumentCheck {
  status: 'passed' | 'warning' | 'failed';
  findings: DocumentFinding[];
  extracted: { label: string; value: string }[];
  detectedKind: DocumentKind | null;
  checkedAt: string;
}

export interface VaultDocument {
  id: string;
  kind: DocumentKind;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  /** Small JPEG thumbnail for images (kept tiny for the prototype). */
  previewDataUrl?: string;
  /** For documents written in the app, e.g. a motivation letter. */
  text?: string;
  isSample?: boolean;
  check: DocumentCheck;
  /** Confirmed with the issuing institution or school. */
  issuer: VerificationStatus;
}

export type ShareStatus = 'requested' | 'shared' | 'approved' | 'resubmit';

/** A sponsor's request for one document, and what the student shared in response. */
export interface DocumentShare {
  id: string;
  applicationId: string;
  kind: DocumentKind;
  note?: string;
  required: boolean;
  status: ShareStatus;
  requestedAt: string;
  dueOn: string;
  sharedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
  /** Copy of the document taken at the moment of sharing — the sponsor never reaches into the vault. */
  snapshot?: Omit<VaultDocument, 'id'> & { documentId: string };
}

export interface FundingAgreement {
  signedName: string;
  signedAt: string;
  guardianName?: string;
  guardianSignedAt?: string;
  terms: string[];
}

export interface TaskEvent {
  taskId: string;
  status: TaskStatus;
  at: string;
  dueDate?: string;
}

/* ---------- Verification & trust ---------- */

export type VerificationStatus = 'not-started' | 'pending' | 'verified' | 'failed';
export type StudentCheckKey = 'identity' | 'enrolment' | 'results' | 'income' | 'guardian';

export interface VerificationItem {
  status: VerificationStatus;
  updatedAt?: string;
  note?: string;
}

export type StudentVerification = Record<StudentCheckKey, VerificationItem> & {
  guardianName?: string;
  guardianRelationship?: string;
};

/** 0 Unverified · 1 ID verified · 2 Verified · 3 Fully verified */
export type TrustLevel = 0 | 1 | 2 | 3;

export type SponsorCheckKey = 'organisation' | 'representative' | 'bank';

/* ---------- Marketplace ---------- */

export type SponsorType = 'company' | 'trust' | 'npo';
export type SponsorStatus = 'active' | 'suspended';

export interface SponsorOrg {
  id: string;
  name: string;
  type: SponsorType;
  registrationNumber: string;
  contactName: string;
  about: string;
  verification: Record<SponsorCheckKey, VerificationItem>;
  status: SponsorStatus;
  suspendedReason?: string;
  isDemo: boolean;
  createdAt: string;
}

export interface Fund {
  id: string;
  sponsorId: string;
  name: string;
  description: string;
  budget: number;
  maxPerStudent: number;
  places: number;
  fields: StudyField[] | 'all';
  provinces: Province[] | 'all';
  incomeBands: IncomeBand[] | 'all';
  minTrust: TrustLevel;
  /** Only students who have told us they have a disability can match. */
  disabilityOnly?: boolean;
  closesOn: string;
  status: 'open' | 'closed';
  createdAt: string;
}

/** What a sponsor may see about a student — anonymised, no surname, no ID number. */
export interface CandidateProfile {
  id: string;
  firstName: string;
  province: Province;
  field: StudyField;
  educationStage: EducationStage;
  institutionId: string | null;
  householdIncome: IncomeBand;
  hasDisability?: boolean;
  apsEstimate: number | null;
  isAdult: boolean;
  trust: TrustLevel;
  checks: Record<StudentCheckKey, VerificationStatus>;
  totalCost: number;
  identifiedFunding: number;
  gap: number;
  /** Share of dated tasks finished on or before the due date. */
  onTimeRate: number | null;
  tasksCompleted: number;
  progressRatio: number;
  discoverable: boolean;
  isLive: boolean;
  /** Semester results for funded students (impact tracking). */
  results?: { term: string; average: number; creditsPassed: number; creditsTaken: number }[];
}

export type ApplicationStatus =
  | 'interested'
  | 'shortlisted'
  | 'offered'
  | 'accepted'
  | 'approved'
  | 'declined-by-student'
  | 'declined-by-sponsor'
  | 'paid';

export interface FundApplication {
  id: string;
  fundId: string;
  studentId: string;
  status: ApplicationStatus;
  amount?: number;
  initiatedBy: 'student' | 'sponsor' | 'agent';
  declineReason?: string;
  paymentReference?: string;
  agreement?: FundingAgreement;
  offerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageFlag {
  kind: 'contact-details' | 'payment-request' | 'off-platform' | 'bank-details';
  label: string;
}

export interface Message {
  id: string;
  applicationId: string;
  from: 'student' | 'sponsor' | 'system';
  text: string;
  at: string;
  flags?: MessageFlag[];
  blocked?: boolean;
}

export interface SponsorDecision {
  studentId: string;
  fundId: string;
  outcome: 'positive' | 'negative';
  reason?: string;
  at: string;
}

export interface PlatformEvent {
  id: string;
  at: string;
  audience: 'student' | 'sponsor' | 'all';
  studentId?: string;
  sponsorId?: string;
  text: string;
  kind: 'offer' | 'message' | 'payment' | 'fund' | 'safety' | 'application' | 'verification' | 'document';
}

export interface PlatformState {
  version: 1;
  sponsors: SponsorOrg[];
  funds: Fund[];
  pool: CandidateProfile[];
  applications: FundApplication[];
  messages: Message[];
  documents: DocumentShare[];
  decisions: Record<string, SponsorDecision[]>;
  events: PlatformEvent[];
}

export type Role = 'student' | 'sponsor';

export interface Session {
  role: Role;
  userId: string;
  email: string;
  demo: boolean;
  /** Signed in with a real account on the Supabase backend (data is shared across devices). */
  backend?: boolean;
}

/* ---------- Intelligence ---------- */

export type AgentDecision = 'approved' | 'dismissed';

export type AgentEffect =
  | { type: 'prepareOpportunity'; opportunityId: string }
  | { type: 'expressInterest'; fundId: string }
  | { type: 'startTask'; taskId: string }
  | { type: 'enableDiscovery' }
  | { type: 'shareDocument'; shareId: string; documentId: string }
  | { type: 'none' };

export interface AgentItem {
  id: string;
  kind: 'prepared' | 'replan' | 'reminder' | 'match' | 'warning' | 'forecast' | 'document';
  title: string;
  detail: string;
  /** The data the agent used — shown so the student can check its reasoning. */
  evidence: string[];
  mode: 'auto' | 'approval';
  effect: AgentEffect;
  approveLabel?: string;
  link?: { label: string; to: string };
  decision?: AgentDecision;
}

export interface NextAction {
  title: string;
  reason: string;
  dueDate?: string;
  daysLeft?: number;
  severity?: Severity;
  taskId?: string;
  route: string;
  routeLabel: string;
}

export interface FundingSummary {
  totalCost: number;
  identifiedFunding: number;
  awardedFunding: number;
  gap: number;
  coveredRatio: number;
}

export interface EngineResult {
  tasks: JourneyTask[];
  hiddenTasks: { task: TaskDefinition; reason: string }[];
  progress: { completed: number; inProgress: number; total: number; ratio: number };
  stageProgress: Record<StageId, { completed: number; total: number }>;
  currentStage: StageId;
  funding: FundingSummary;
  alerts: RiskAlert[];
  nextAction: NextAction | null;
  deadlines: JourneyTask[];
  matches: StudyMatch[];
}

export interface NavigatorSource {
  label: string;
  url: string;
}

export interface NavigatorReply {
  paragraphs: string[];
  bullets?: string[];
  actions?: { label: string; to: string }[];
  sources?: NavigatorSource[];
}

export interface ChatMessage {
  id: string;
  role: 'student' | 'navigator';
  text?: string;
  reply?: NavigatorReply;
}
