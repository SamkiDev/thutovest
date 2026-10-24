import type { DocumentKind, FundTerms } from '../types';
import { conditionLines, coversText } from '../platform/bursaryRules';

export const DOCUMENT_INFO: Record<
  DocumentKind,
  {
    label: string;
    short: string;
    hint: string;
    issuerCheck: boolean;
    writeInApp?: boolean;
    /** Only for under-18s. */
    guardianOnly?: boolean;
    /** Created by the guardian's consent on the Verification page, not uploaded. */
    fromConsent?: boolean;
  }
> = {
  'admission-letter': {
    label: 'Admission letter',
    short: 'Admission',
    hint: 'Your offer or admission letter from the university, college or TVET.',
    issuerCheck: true,
  },
  'id-copy': {
    label: 'Certified copy of ID',
    short: 'ID copy',
    hint: 'Certified within the last 3 months.',
    issuerCheck: false,
  },
  'latest-results': {
    label: 'Latest school results',
    short: 'Results',
    hint: 'Grade 11 final, Grade 12 June or final NSC results.',
    issuerCheck: true,
  },
  'income-proof': {
    label: 'Proof of household income',
    short: 'Income',
    hint: 'Payslips, a SASSA letter or an affidavit for each earning adult.',
    issuerCheck: false,
  },
  'motivation-letter': {
    label: 'Motivation letter',
    short: 'Motivation',
    hint: 'Written in the app. Tell a sponsor why you’re studying and what support would change.',
    issuerCheck: false,
    writeInApp: true,
  },
  'registration-proof': {
    label: 'Proof of registration',
    short: 'Registration',
    hint: 'From your institution once you’ve registered.',
    issuerCheck: true,
  },
  'semester-results': {
    label: 'Semester results',
    short: 'Semester results',
    hint: 'Your academic record after each semester, for funded students.',
    issuerCheck: true,
  },
  'guardian-consent': {
    label: 'Guardian consent form',
    short: 'Guardian consent',
    hint: 'Created when your parent or guardian consents on the Verification page.',
    issuerCheck: false,
    guardianOnly: true,
    fromConsent: true,
  },
  'guardian-id': {
    label: 'Certified copy of guardian’s ID',
    short: 'Guardian ID',
    hint: 'Your parent or guardian’s ID, certified within the last 3 months.',
    issuerCheck: false,
    guardianOnly: true,
  },
  'guardianship-proof': {
    label: 'Proof of guardianship',
    short: 'Guardianship',
    hint: 'Your birth certificate. If your guardian isn’t your parent: a sworn affidavit or a court order.',
    issuerCheck: false,
    guardianOnly: true,
  },
};

/** A document's name inside a sentence: only the first letter is lowered, so "ID" stays "ID". */
export const docName = (kind: DocumentKind): string => {
  const label = DOCUMENT_INFO[kind].label;
  return label.charAt(0).toLowerCase() + label.slice(1);
};

export const VAULT_ORDER: DocumentKind[] = [
  'admission-letter',
  'id-copy',
  'latest-results',
  'income-proof',
  'motivation-letter',
  'registration-proof',
  'semester-results',
  'guardian-consent',
  'guardian-id',
  'guardianship-proof',
];

/** What a sponsor can ask for when making an offer. Admission letter is always required. */
export const OFFER_DOCUMENT_OPTIONS: DocumentKind[] = ['admission-letter', 'latest-results', 'income-proof', 'id-copy', 'motivation-letter'];

export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'];
export const MAX_FILE_BYTES = 8 * 1024 * 1024;

/**
 * Checks the file's first bytes, not just its name or the type the browser
 * reports, so a renamed .exe or .html can't pass as a PDF or photo.
 * The same check must run again on the server before storing the file.
 */
export async function sniffFileType(file: File): Promise<'pdf' | 'jpeg' | 'png' | 'webp' | 'heic' | null> {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (ascii(0, 5) === '%PDF-') return 'pdf';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
  if (ascii(4, 8) === 'ftyp' && /^(heic|heix|mif1|msf1|heim|heis)$/.test(ascii(8, 12))) return 'heic';
  return null;
}

export function fundingTerms(sponsorName: string, amount: string, institution: string, docs: string[], bursary: FundTerms = { covers: 'all' }): string[] {
  return [
    `${sponsorName} awards ${amount} for the next academic year.`,
    `It pays for: ${coversText(bursary).toLowerCase()}.`,
    ...conditionLines(bursary, sponsorName),
    `The award is paid only to ${institution}. It is never paid to you, your family or anyone else.`,
    `Payment is released after ${sponsorName} approves these documents, shared through the app: ${docs.join(', ')}.`,
    'You will share your semester results through the app so the sponsor can see your progress.',
    'You never pay any fee to receive this award. Report any request for money in the app.',
    'This is a bursary, not a loan, and does not need to be repaid.',
  ];
}
