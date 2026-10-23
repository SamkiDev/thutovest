import type { DocumentKind } from '../types';

export const DOCUMENT_INFO: Record<DocumentKind, { label: string; short: string; hint: string; issuerCheck: boolean; writeInApp?: boolean }> = {
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
};

export const VAULT_ORDER: DocumentKind[] = ['admission-letter', 'id-copy', 'latest-results', 'income-proof', 'motivation-letter', 'registration-proof', 'semester-results'];

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

export function fundingTerms(sponsorName: string, amount: string, institution: string, docs: string[]): string[] {
  return [
    `${sponsorName} awards ${amount} for the next academic year.`,
    `The award is paid only to ${institution}. It is never paid to you, your family or anyone else.`,
    `Payment is released after ${sponsorName} approves these documents, shared through the app: ${docs.join(', ')}.`,
    'You will share your semester results through the app so the sponsor can see your progress.',
    'You never pay any fee to receive this award. Report any request for money in the app.',
    'This is a bursary, not a loan, and does not need to be repaid.',
  ];
}
