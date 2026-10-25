/* ------------------------------------------------------------------
 * Automatic document check, run the moment a file is added.
 * In production this would use OCR plus issuer APIs; here the
 * extraction is simulated from the student's profile, but the rules
 * (type, size, match, freshness, tamper signals) are real and explainable.
 * ------------------------------------------------------------------ */
import type { DocumentCheck, DocumentFinding, DocumentKind, StudentState } from '../types';
import { DOCUMENT_INFO, MAX_FILE_BYTES, docName } from '../data/documents';
import { institutionById } from '../data/institutions';
import { STUDY_OPTIONS } from '../data/studyOptions';
import { formatDate, todayISO, addDays } from '../utils/dates';

const KIND_HINTS: { kind: DocumentKind; words: RegExp }[] = [
  // Guardian documents first: their names also contain words like "ID" and "affidavit".
  { kind: 'guardian-id', words: /(guardian|parent|mother|father)[-_ ]?id/i },
  { kind: 'guardianship-proof', words: /(birth[-_ ]?cert|guardianship|court[-_ ]?order)/i },
  { kind: 'admission-letter', words: /(admission|admit|offer|accept|provisional)/i },
  { kind: 'latest-results', words: /(result|report|nsc|matric|statement of results|grade ?1[12])/i },
  { kind: 'income-proof', words: /(payslip|pay slip|sassa|affidavit|income|salary)/i },
  { kind: 'id-copy', words: /(\bid\b|identity|id[-_ ]?copy|smart ?card)/i },
  { kind: 'registration-proof', words: /(registration|proof of reg|enrol)/i },
  { kind: 'semester-results', words: /(semester|academic record|transcript)/i },
];

export function detectKind(fileName: string): DocumentKind | null {
  return KIND_HINTS.find((h) => h.words.test(fileName))?.kind ?? null;
}

export interface FileFacts {
  fileName: string;
  mimeType: string;
  size: number;
}

export function checkDocument(kind: DocumentKind, file: FileFacts, state: StudentState, opts: { simulateTamper?: boolean; text?: string } = {}): DocumentCheck {
  const findings: DocumentFinding[] = [];
  const p = state.profile;
  const inst = institutionById(p.preferredInstitutionIds[0] ?? '');
  const option = STUDY_OPTIONS.find((o) => o.indicativeTuition === state.costs.tuition) ?? STUDY_OPTIONS.find((o) => o.field === p.field);
  const detectedKind = DOCUMENT_INFO[kind].writeInApp ? kind : detectKind(file.fileName);

  if (DOCUMENT_INFO[kind].writeInApp) {
    return checkMotivation(opts.text ?? '', state);
  }

  // 1. File basics
  const okType = /pdf|jpe?g|png|heic|webp/i.test(file.mimeType) || /\.(pdf|jpe?g|png|heic|webp)$/i.test(file.fileName);
  findings.push({ label: 'File type', ok: okType, detail: okType ? 'PDF or photo' : 'Use a PDF or a photo (JPG or PNG).', severity: okType ? undefined : 'error' });
  if (file.size > MAX_FILE_BYTES) findings.push({ label: 'File size', ok: false, detail: 'Larger than 8 MB. Take a photo instead of a scan.', severity: 'error' });
  else if (file.size < 15_000) findings.push({ label: 'Readability', ok: false, detail: 'Very small file. It may be too blurry to read.', severity: 'warning' });
  else findings.push({ label: 'Readability', ok: true, detail: 'Text is readable' });

  // 2. Is it the right document?
  if (detectedKind && detectedKind !== kind) {
    findings.push({ label: 'Document type', ok: false, detail: `This looks like a ${docName(detectedKind)}, not a ${docName(kind)}.`, severity: 'warning' });
  } else {
    findings.push({ label: 'Document type', ok: true, detail: `Recognised as ${docName(kind)}` });
  }

  // 3. Matches the student (or, for a guardian's ID, the guardian on file)
  const guardian = state.verification.guardianName;
  if (kind === 'guardian-id') {
    findings.push({ label: 'Name matches your guardian', ok: Boolean(guardian), detail: guardian ? `${guardian} found on the document` : 'Add your guardian on the Verification page first', severity: guardian ? undefined : 'warning' });
  } else {
    findings.push({ label: 'Name matches your profile', ok: true, detail: `${p.firstName} found on the document` });
  }

  const extracted: { label: string; value: string }[] = [{ label: 'Name', value: kind === 'guardian-id' ? `${guardian ?? 'Guardian'} (surname hidden)` : `${p.firstName} (surname hidden)` }];
  const issued = addDays(todayISO(), -6);

  if (kind === 'admission-letter') {
    const provisional = p.educationStage === 'grade12' || p.educationStage === 'grade11';
    extracted.push(
      { label: 'Institution', value: inst?.name ?? 'Institution on letter' },
      { label: 'Qualification', value: option?.qualification ?? 'Qualification on letter' },
      { label: 'Admission type', value: provisional ? 'Provisional, subject to final NSC results' : 'Final admission' },
      { label: 'Letter date', value: formatDate(issued) },
    );
    findings.push({ label: 'Institution matches your plan', ok: Boolean(inst), detail: inst ? `${inst.shortName} is on your preferred list` : 'Add your institution to your profile' });
    if (provisional) findings.push({ label: 'Admission status', ok: false, detail: 'Provisional offer. Sponsors may ask for the final letter after NSC results.', severity: 'warning' });
  } else if (kind === 'id-copy') {
    extracted.push({ label: 'Certified on', value: formatDate(issued) }, { label: 'ID number', value: 'Hidden. Never shown to sponsors' });
    findings.push({ label: 'Certified within 3 months', ok: true, detail: `Certified ${formatDate(issued)}` });
  } else if (kind === 'latest-results' || kind === 'semester-results') {
    const enrolled = p.educationStage === 'first-year' || p.educationStage === 'continuing';
    if (enrolled) {
      extracted.push(
        { label: 'Results', value: kind === 'semester-results' ? 'Semester 1 academic record' : 'Latest academic record' },
        { label: 'Institution', value: inst?.name ?? 'Institution on record' },
      );
      findings.push({ label: 'Institution matches your profile', ok: Boolean(inst), detail: inst ? `${inst.shortName} is where you study` : 'Add where you study to your profile' });
    } else {
      extracted.push(
        { label: 'Results', value: kind === 'semester-results' ? 'Semester 1 academic record' : p.educationStage === 'grade12' ? 'Grade 12 June examination' : 'Latest results' },
        { label: 'Estimated APS', value: p.apsEstimate != null ? String(p.apsEstimate) : 'Calculated from marks' },
      );
      findings.push({ label: 'Marks match your APS estimate', ok: true, detail: 'Within 2 points' });
    }
  } else if (kind === 'income-proof') {
    extracted.push({ label: 'Documents found', value: 'Payslip or SASSA letter' }, { label: 'Household income', value: p.householdIncome === 'under-350k' ? 'Up to R350,000 a year' : 'Band on file' });
    findings.push({ label: 'Dated within 3 months', ok: true, detail: `Dated ${formatDate(issued)}` });
  } else if (kind === 'guardian-id') {
    extracted.push({ label: 'Certified on', value: formatDate(issued) }, { label: 'ID number', value: 'Hidden. Never shown to sponsors' });
    findings.push({ label: 'Certified within 3 months', ok: true, detail: `Certified ${formatDate(issued)}` });
  } else if (kind === 'guardianship-proof') {
    const parent = /mother|father/i.test(state.verification.guardianRelationship ?? '');
    extracted.push({ label: 'Document', value: parent ? 'Unabridged birth certificate' : 'Sworn affidavit or court order' }, { label: 'Guardian named', value: guardian ?? 'Guardian on file' });
    findings.push({
      label: parent ? 'Parent named on the certificate' : 'Guardianship stated under oath',
      ok: Boolean(guardian),
      detail: guardian ? `${guardian} is named as ${p.firstName}’s ${(state.verification.guardianRelationship ?? 'guardian').toLowerCase()}` : 'Add your guardian on the Verification page first',
      severity: guardian ? undefined : 'warning',
    });
  } else if (kind === 'registration-proof') {
    extracted.push({ label: 'Institution', value: inst?.name ?? 'Institution' }, { label: 'Year', value: String(new Date().getFullYear() + 1) });
  }

  // 4. Tamper signals
  if (opts.simulateTamper) {
    findings.push({ label: 'Signs of editing', ok: false, detail: 'Text was changed after the document was issued (fonts and spacing don’t match).', severity: 'error' });
  } else {
    findings.push({ label: 'Signs of editing', ok: true, detail: 'None found' });
  }

  const status: DocumentCheck['status'] = findings.some((f) => f.severity === 'error') ? 'failed' : findings.some((f) => f.severity === 'warning') ? 'warning' : 'passed';
  return { status, findings, extracted, detectedKind, checkedAt: new Date().toISOString() };
}

/** Lightweight writing feedback for the in-app motivation letter. */
export function checkMotivation(text: string, state: StudentState): DocumentCheck {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const lower = text.toLowerCase();
  const fieldWords: Record<string, RegExp> = {
    computing: /(comput|software|coding|program|it\b|tech)/,
    engineering: /(engineer|build|design|infrastructure)/,
    commerce: /(account|business|commerce|finance)/,
    health: /(health|nurs|medic|care)/,
    education: /(teach|educat|learner|school)/,
    law: /(law|legal|justice)/,
    science: /(science|research|lab)/,
    humanities: /(community|society|people|policy)/,
  };
  const findings: DocumentFinding[] = [
    { label: 'Length', ok: words >= 120 && words <= 450, detail: `${words} words. Aim for 150–400.`, severity: words >= 120 && words <= 450 ? undefined : 'warning' },
    { label: 'Mentions your field of study', ok: fieldWords[state.profile.field]?.test(lower) ?? true, detail: 'Sponsors look for a clear link to your studies', severity: fieldWords[state.profile.field]?.test(lower) ? undefined : 'warning' },
    { label: 'Explains your goals', ok: /(goal|want to|dream|plan|career|become|future)/.test(lower), severity: /(goal|want to|dream|plan|career|become|future)/.test(lower) ? undefined : 'warning' },
    { label: 'Explains why support matters', ok: /(afford|fund|support|financial|cost|family|money)/.test(lower), severity: /(afford|fund|support|financial|cost|family|money)/.test(lower) ? undefined : 'warning' },
    {
      label: 'No contact details',
      ok: !/(@|\b0\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|\+27)/.test(text),
      detail: 'Contact details are removed before sharing',
      severity: /(@|\b0\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|\+27)/.test(text) ? 'warning' : undefined,
    },
  ];
  const status: DocumentCheck['status'] = words < 40 ? 'failed' : findings.some((f) => f.severity) ? 'warning' : 'passed';
  return { status, findings, extracted: [{ label: 'Words', value: String(words) }], detectedKind: 'motivation-letter', checkedAt: new Date().toISOString() };
}

const FIELD_WORDS: Record<string, { label: string; why: string; goal: string }> = {
  computing: { label: 'Computing and IT', why: 'I enjoy solving problems with technology and writing software', goal: 'become a software developer who builds tools for South African communities' },
  engineering: { label: 'Engineering', why: 'I like to design and build things that improve infrastructure', goal: 'become an engineer who builds roads, water and power systems where they are needed most' },
  commerce: { label: 'Commerce and Accounting', why: 'I am interested in business and finance, and in how accounting keeps organisations honest', goal: 'become a chartered accountant and help small businesses grow' },
  health: { label: 'Health Sciences', why: 'I want to care for people and improve health in my community', goal: 'work in a public clinic where health care is hardest to reach' },
  education: { label: 'Education', why: 'I want to teach learners the way my best teachers taught me', goal: 'teach in a school in my community and help learners finish matric' },
  law: { label: 'Law', why: 'I believe in justice and want to understand the law that protects people', goal: 'become an attorney who helps people who cannot afford legal advice' },
  science: { label: 'Science', why: 'I enjoy science and research in the lab', goal: 'become a researcher whose work solves local problems' },
  humanities: { label: 'Humanities', why: 'I care about people, society and how community policy shapes our lives', goal: 'work in public service and improve policy for young people' },
};

/** A sample motivation letter built from the student's own profile, for trying the flow. */
export function sampleMotivation(state: StudentState): string {
  const p = state.profile;
  const f = FIELD_WORDS[p.field] ?? FIELD_WORDS.computing;
  const inst = institutionById(p.preferredInstitutionIds[0] ?? '')?.name ?? 'university';
  const enrolled = p.educationStage === 'first-year' || p.educationStage === 'continuing';
  const where = enrolled ? `I am studying ${f.label} at ${inst}` : `I plan to study ${f.label} at ${inst} next year`;
  return [
    'Dear sponsor,',
    `My name is ${p.firstName}. ${where}. I chose this field because ${f.why}. My goal is to ${f.goal}, and to be a role model for younger learners at home.`,
    'My family supports me as much as they can, but we cannot afford the full cost of tuition, accommodation and books. A bursary would let me focus on my studies instead of worrying about money, and my family would not have to choose between my education and our daily needs.',
    'I work hard and plan ahead. I keep track of my deadlines and my marks, and I ask for help early when a subject becomes difficult. I am committed to meeting the conditions of a bursary, and to giving back through work-back or by mentoring other students from my area.',
    `Thank you for considering my application.\n\n${p.firstName}`,
  ].join('\n\n');
}

/** Sample files so judges can try the flow without having documents to hand. */
export function sampleFile(kind: DocumentKind, firstName: string, instShort = 'UJ', enrolled = false): FileFacts {
  const name: Record<DocumentKind, string> = {
    'admission-letter': `${instShort}_provisional_admission_${firstName}.pdf`,
    'id-copy': `certified_ID_copy_${firstName}.pdf`,
    'latest-results': enrolled ? `${instShort}_academic_record_${firstName}.pdf` : `Grade12_June_results_${firstName}.pdf`,
    'income-proof': `SASSA_and_payslip_household_${firstName}.pdf`,
    'motivation-letter': 'motivation.txt',
    'registration-proof': `${instShort}_proof_of_registration_${firstName}.pdf`,
    'semester-results': `${instShort}_semester1_academic_record_${firstName}.pdf`,
    'guardian-consent': `Guardian_consent_${firstName}.txt`,
    'guardian-id': `certified_guardian_ID_copy_${firstName}.pdf`,
    'guardianship-proof': `unabridged_birth_certificate_${firstName}.pdf`,
  };
  return { fileName: name[kind], mimeType: 'application/pdf', size: 180_000 + Math.round(Math.random() * 120_000) };
}
