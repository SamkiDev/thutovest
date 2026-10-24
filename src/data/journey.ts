import type { JourneyStage, StudentProfile, TaskDefinition } from '../types';

export const STAGES: JourneyStage[] = [
  { id: 'explore', title: 'Explore study options', short: 'Explore', description: 'Find qualifications that fit your goals, marks and budget.' },
  { id: 'apply', title: 'Prepare applications', short: 'Apply', description: 'Get documents ready and submit before closing dates.' },
  { id: 'funding', title: 'Explore funding', short: 'Funding', description: 'Work out your funding gap and apply for support.' },
  { id: 'requirements', title: 'Complete outstanding requirements', short: 'Offers', description: 'Follow up on outcomes and outstanding items.' },
  { id: 'registration', title: 'Prepare for registration', short: 'Register', description: 'Line up documents, fees and a place to stay.' },
  { id: 'year', title: 'Prepare for the academic year', short: 'Start', description: 'Set yourself up for a strong first semester.' },
];

const isEnrolled = (p: StudentProfile) => p.educationStage === 'first-year' || p.educationStage === 'continuing';
const isApplicant = (p: StudentProfile) => !isEnrolled(p);
const isDistance = (p: StudentProfile) => p.studyMode === 'distance';

/**
 * Journey task catalogue. `hiddenWhen` returns a plain-language reason when a
 * task does not apply — the Journey page shows these reasons so students can
 * see how their profile shaped the plan.
 */
export const TASKS: TaskDefinition[] = [
  // Explore
  {
    id: 't-shortlist', stageId: 'explore', kind: 'planning', priority: 'medium',
    title: 'Shortlist three study options',
    description: 'Save three so you have a first choice and backups.',
    action: { label: 'Explore study options', to: '/app/explore' },
    hiddenWhen: (p) => (isEnrolled(p) ? 'You are already enrolled in a qualification.' : null),
  },
  {
    id: 't-aps', stageId: 'explore', kind: 'planning', priority: 'low',
    title: 'Check your APS against entry guides',
    description: 'Compare your APS with each option’s entry guide.',
    action: { label: 'Compare options', to: '/app/explore' },
    hiddenWhen: (p) => (isEnrolled(p) ? 'You are already enrolled in a qualification.' : null),
  },
  // Apply
  {
    id: 't-app-first', stageId: 'apply', kind: 'application', priority: 'high', dueInDays: 6,
    title: 'Submit your first-choice application',
    description: 'Fill in the online form and pay any fee.',
    action: { label: 'See application checklist', to: '/app/navigator?ask=application' },
    hiddenWhen: (p) => (isEnrolled(p) ? 'You are already enrolled in a qualification.' : null),
  },
  {
    id: 't-doc-id', stageId: 'apply', kind: 'document', priority: 'high', dueInDays: 6, document: 'id-copy',
    title: 'Upload a certified copy of your ID',
    description: 'Recently certified. Police stations certify for free.',
    action: { label: 'Ask about certification', to: '/app/navigator?ask=documents' },
    hiddenWhen: (p) => (isEnrolled(p) ? 'You are already enrolled in a qualification.' : null),
  },
  {
    id: 't-doc-results', stageId: 'apply', kind: 'document', priority: 'high', dueInDays: 6, document: 'latest-results',
    title: 'Upload your latest school results',
    description: 'Grade 11 final or Grade 12 June report for now.',
    action: { label: 'What to upload', to: '/app/navigator?ask=documents' },
    hiddenWhen: (p) => (isEnrolled(p) ? 'You are already enrolled in a qualification.' : null),
  },
  {
    id: 't-app-backup', stageId: 'apply', kind: 'application', priority: 'medium', dueInDays: 20,
    title: 'Apply to a backup option',
    description: 'Protects you if your first choice is full.',
    action: { label: 'Find a backup', to: '/app/explore' },
    hiddenWhen: (p) => (isEnrolled(p) ? 'You are already enrolled in a qualification.' : null),
  },
  // Funding
  {
    id: 't-fund-review', stageId: 'funding', kind: 'funding', priority: 'medium',
    title: 'Review your estimated funding gap',
    description: 'Check your costs and the funding you’ve found.',
    action: { label: 'Open funding', to: '/app/funding' },
  },
  {
    id: 't-funding-main', stageId: 'funding', kind: 'funding', priority: 'high', dueInDays: 18,
    title: 'Start your main funding application',
    description: 'Start your strongest match, such as NSFAS.',
    action: { label: 'View possible matches', to: '/app/funding#opportunities' },
    hiddenWhen: (p) => (p.fundingNeed === 'no' ? 'You said you don’t need funding assistance.' : null),
  },
  {
    id: 't-doc-income', stageId: 'funding', kind: 'document', priority: 'medium', dueInDays: 18, document: 'income-proof',
    title: 'Gather proof of household income',
    description: 'Payslips, a pension slip or an affidavit per earning adult.',
    action: { label: 'What counts?', to: '/app/navigator?ask=income' },
    hiddenWhen: (p) => (p.fundingNeed === 'no' ? 'You said you don’t need funding assistance.' : null),
  },
  {
    id: 't-bursary', stageId: 'funding', kind: 'funding', priority: 'medium', dueInDays: 34,
    title: 'Apply to one bursary or scholarship',
    description: 'A second application, so you don’t rely on one.',
    action: { label: 'View opportunities', to: '/app/funding#opportunities' },
    hiddenWhen: (p) => (p.fundingNeed === 'no' ? 'You said you don’t need funding assistance.' : null),
  },
  {
    id: 't-funding-renew', stageId: 'funding', kind: 'funding', priority: 'high', dueInDays: 25,
    title: 'Confirm your funding continues next year',
    description: 'Check renewal rules and the marks your funder expects.',
    action: { label: 'Ask about renewals', to: '/app/navigator?ask=funding' },
    hiddenWhen: (p) => (isApplicant(p) ? 'Only applies once you are enrolled.' : p.fundingNeed === 'no' ? 'You said you don’t need funding assistance.' : null),
  },
  // Requirements
  {
    id: 't-track', stageId: 'requirements', kind: 'application', priority: 'low',
    title: 'Track application outcomes',
    description: 'Check here weekly. Institutions may use their own portals.',
    action: { label: 'Open journey tips', to: '/app/navigator?ask=next' },
    hiddenWhen: (p) => (isEnrolled(p) ? 'You are already enrolled in a qualification.' : null),
  },
  {
    id: 't-final-results', stageId: 'requirements', kind: 'document', priority: 'medium',
    title: 'Send final results when they’re released',
    description: 'Provisional offers usually depend on final NSC results.',
    action: { label: 'Provisional offers', to: '/app/navigator?ask=application' },
    hiddenWhen: (p) => (p.educationStage === 'gap-year' ? 'Your final results are already available.' : isEnrolled(p) ? 'You are already enrolled in a qualification.' : null),
  },
  {
    id: 't-accept', stageId: 'requirements', kind: 'application', priority: 'high',
    title: 'Accept an offer',
    description: 'Accept before the deadline or lose the place.',
    action: { label: 'Compare your options', to: '/app/explore' },
    hiddenWhen: (p) => (isEnrolled(p) ? 'You are already enrolled in a qualification.' : null),
  },
  {
    id: 't-academic', stageId: 'requirements', kind: 'planning', priority: 'medium',
    title: 'Check your academic progress',
    description: 'Stay on track with the credits you need.',
    action: { label: 'Progress rules', to: '/app/navigator?ask=funding' },
    hiddenWhen: (p) => (isApplicant(p) ? 'Only applies once you are enrolled.' : null),
  },
  // Registration
  {
    id: 't-reg-docs', stageId: 'registration', kind: 'registration', priority: 'medium', dueInDays: 75,
    title: 'Prepare registration documents',
    description: 'Offer letter, ID and final results in one place.',
    action: { label: 'Ask about registration', to: '/app/navigator?ask=registration' },
    hiddenWhen: (p) => (p.educationStage === 'continuing' ? 'Returning students re-register instead.' : null),
  },
  {
    id: 't-reregister', stageId: 'registration', kind: 'registration', priority: 'high', dueInDays: 40,
    title: 'Re-register for next year',
    description: 'Clear fee blocks and choose modules before it closes.',
    action: { label: 'Ask about registration', to: '/app/navigator?ask=registration' },
    hiddenWhen: (p) => (isApplicant(p) ? 'Only applies once you are enrolled.' : null),
  },
  {
    id: 't-reg-fee', stageId: 'registration', kind: 'registration', priority: 'high', dueInDays: 75,
    title: 'Plan for the registration fee',
    description: 'Usually paid upfront unless funding is confirmed.',
    action: { label: 'Plan funding', to: '/app/funding' },
  },
  {
    // High: places fill fast, and only students who'll live away from home see this step.
    id: 't-accommodation', stageId: 'registration', kind: 'registration', priority: 'high', dueInDays: 30,
    title: 'Apply for accommodation',
    description: 'Places fill fast. Private places only if accredited.',
    action: { label: 'Open Residences', to: '/app/residences' },
    hiddenWhen: (p) =>
      isDistance(p) ? 'You chose distance learning.' : p.livingArrangement === 'home' ? 'You plan to live at home.' : null,
  },
  // Academic year
  {
    id: 't-device', stageId: 'year', kind: 'planning', priority: 'medium',
    title: 'Plan for a laptop and data',
    description: 'Check if your funding covers learning materials.',
    action: { label: 'Add to costs', to: '/app/funding' },
  },
  {
    id: 't-budget', stageId: 'year', kind: 'planning', priority: 'low',
    title: 'Set a monthly student budget',
    description: 'Split your funding into monthly food, transport and data.',
    action: { label: 'Open funding', to: '/app/funding' },
  },
  {
    id: 't-orientation', stageId: 'year', kind: 'planning', priority: 'low',
    title: 'Plan your orientation week',
    description: 'Timetables, residence rules and support services.',
    action: { label: 'What to expect', to: '/app/navigator?ask=next' },
    hiddenWhen: (p) => (isDistance(p) ? 'You chose distance learning.' : p.educationStage === 'continuing' ? 'You’ve done orientation before.' : null),
  },
  {
    id: 't-support', stageId: 'year', kind: 'planning', priority: 'low',
    title: 'Find your student support services',
    description: 'Tutoring, counselling and financial aid help from day one.',
    action: { label: 'Ask about support', to: '/app/navigator?ask=support' },
  },
];

export const taskById = (id: string) => TASKS.find((t) => t.id === id);
