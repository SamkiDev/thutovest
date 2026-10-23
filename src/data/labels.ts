import type {
  ApplicationProgress,
  ApplicationStatus,
  CostKey,
  DocumentKey,
  EducationStage,
  FundingNeed,
  FundingSourceKind,
  IncomeBand,
  InstitutionType,
  LivingArrangement,
  OpportunityStatus,
  Priority,
  Province,
  Severity,
  StudyField,
  StudyModePreference,
  TaskStatus,
} from '../types';

export const PROVINCES: Province[] = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

export const EDUCATION_STAGES: { value: EducationStage; label: string; hint: string }[] = [
  { value: 'grade11', label: 'Grade 11', hint: 'Planning ahead for next year' },
  { value: 'grade12', label: 'Grade 12', hint: 'Applying this year' },
  { value: 'gap-year', label: 'Finished school', hint: 'Taking a gap or re-applying' },
  { value: 'first-year', label: 'First-year student', hint: 'Already studying' },
  { value: 'continuing', label: 'Senior student', hint: 'Second year or later' },
];

export const FIELDS: { value: StudyField; label: string }[] = [
  { value: 'computing', label: 'Computing & IT' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'commerce', label: 'Commerce & Accounting' },
  { value: 'health', label: 'Health Sciences' },
  { value: 'education', label: 'Teaching & Education' },
  { value: 'law', label: 'Law' },
  { value: 'science', label: 'Natural Sciences' },
  { value: 'humanities', label: 'Humanities & Social Sciences' },
];

export const STUDY_MODES: { value: StudyModePreference; label: string; hint: string }[] = [
  { value: 'contact', label: 'On campus', hint: 'Full-time classes in person' },
  { value: 'distance', label: 'Distance', hint: 'Study online, from home' },
  { value: 'blended', label: 'Blended', hint: 'Mix of campus and online' },
  { value: 'any', label: 'Open to any', hint: 'Show me everything' },
];

export const MODE_LABEL: Record<string, string> = {
  contact: 'On campus',
  distance: 'Distance',
  blended: 'Blended',
  any: 'Any mode',
};

export const INSTITUTION_TYPE_LABEL: Record<InstitutionType, string> = {
  university: 'University',
  'university-of-technology': 'University of Technology',
  tvet: 'TVET College',
  private: 'Private institution',
};

export const INCOME_BANDS: { value: IncomeBand; label: string }[] = [
  { value: 'under-350k', label: 'Up to R350,000 a year' },
  { value: '350k-600k', label: 'R350,001 – R600,000 a year' },
  { value: 'over-600k', label: 'More than R600,000 a year' },
  { value: 'prefer-not', label: 'Prefer not to say' },
];

export const FUNDING_NEED: { value: FundingNeed; label: string; hint: string }[] = [
  { value: 'yes', label: 'Yes', hint: 'I will need bursaries, aid or loans' },
  { value: 'unsure', label: 'Not sure yet', hint: 'Help me work it out' },
  { value: 'no', label: 'No', hint: 'My study costs are covered' },
];

export const LIVING: { value: LivingArrangement; label: string; hint: string }[] = [
  { value: 'home', label: 'Live at home', hint: 'Commute to campus' },
  { value: 'residence', label: 'University residence', hint: 'Live on or near campus' },
  { value: 'private', label: 'Private accommodation', hint: 'Rent a room or flat' },
];

export const APPLICATION_PROGRESS: { value: ApplicationProgress; label: string; hint: string }[] = [
  { value: 'not-started', label: 'Not started', hint: "I haven't looked yet" },
  { value: 'researching', label: 'Researching', hint: 'Comparing options' },
  { value: 'started', label: 'Applications started', hint: 'At least one in progress' },
  { value: 'submitted', label: 'Submitted', hint: 'Waiting for outcomes' },
  { value: 'accepted', label: 'Offer accepted', hint: 'Getting ready to register' },
];

export const DOCUMENTS: { value: DocumentKey; label: string; hint: string }[] = [
  { value: 'id-copy', label: 'Certified copy of ID', hint: 'Usually certified within the last 3 months' },
  { value: 'latest-results', label: 'Latest school results', hint: 'Grade 11 final or Grade 12 mid-year' },
  { value: 'income-proof', label: 'Household income proof', hint: 'Payslips or affidavit, for funding' },
];

export const COST_LABELS: Record<CostKey, { label: string; hint: string }> = {
  tuition: { label: 'Tuition', hint: 'Indicative first-year fees' },
  accommodation: { label: 'Accommodation', hint: 'Residence or rent for 10 months' },
  books: { label: 'Books & learning materials', hint: 'Textbooks, stationery, software' },
  transport: { label: 'Transport', hint: 'Taxi, bus or train for the year' },
  other: { label: 'Other study costs', hint: 'Data, food top-ups, printing' },
};

export const SOURCE_KIND_LABEL: Record<FundingSourceKind, string> = {
  family: 'Family contribution',
  savings: 'Savings',
  bursary: 'Bursary',
  loan: 'Loan',
  work: 'Part-time work',
  other: 'Other',
};

export const OPPORTUNITY_STATUS: { value: OpportunityStatus; label: string }[] = [
  { value: 'not-started', label: 'Not started' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'unsuccessful', label: 'Unsuccessful' },
];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'To do',
  'in-progress': 'In progress',
  completed: 'Done',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  urgent: 'Act now',
  soon: 'Coming up',
  watch: 'To watch',
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  interested: 'Profile shared',
  shortlisted: 'Shortlisted',
  offered: 'Offer received',
  accepted: 'Accepted, documents needed',
  approved: 'Funding approved, payment pending',
  'declined-by-student': 'You declined',
  'declined-by-sponsor': 'Closed',
  paid: 'Paid to institution',
};

export const SPONSOR_STATUS_LABEL: Record<ApplicationStatus, string> = {
  interested: 'Shared profile with you',
  shortlisted: 'Shortlisted',
  offered: 'Offer sent',
  accepted: 'Accepted, documents in review',
  approved: 'Approved, ready to pay',
  'declined-by-student': 'Student declined',
  'declined-by-sponsor': 'Passed',
  paid: 'Paid to institution',
};
