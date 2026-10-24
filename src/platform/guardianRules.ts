import type { CandidateProfile, DocumentKind, VaultDocument } from '../types';

/**
 * Children (under 18). POPIA (sections 34 and 35) needs a parent's or guardian's
 * consent before a child's information is processed, and a minor needs a guardian
 * to assist with a contract such as a bursary agreement. Used by the app and,
 * through authorize(), the reducer and project(), by the server.
 */

/** Required on every offer to an under-18, on top of what the sponsor asks for. */
export const GUARDIAN_DOCS: DocumentKind[] = ['guardian-consent', 'guardian-id', 'guardianship-proof'];

export const isMinor = (c: Pick<CandidateProfile, 'isAdult'>): boolean => c.isAdult === false;

/** Sponsors only ever see a child once a parent or guardian has consented. */
export const visibleToSponsors = (c: CandidateProfile): boolean => !isMinor(c) || c.checks?.guardian === 'verified';

export function guardianConsentStatement(child: string, guardian: string, relationship: string): string {
  return (
    `${guardian ? `I, ${guardian}, am` : 'I am'} ${child}’s ${relationship.toLowerCase()}. I consent to ThutoVest keeping ${child}’s study plan, ` +
    `and to sharing an anonymised profile and the documents ${child} chooses with verified sponsors. ` +
    `Before ${child} accepts any bursary, I will read its conditions and co-sign the agreement.`
  );
}

/** The consent form a child shares with a sponsor, created the moment the guardian consents. */
export function guardianConsentDocument(child: string, guardian: string, relationship: string, text: string, at: string): VaultDocument {
  const day = at.slice(0, 10);
  return {
    id: `doc-guardian-consent-${at}`,
    kind: 'guardian-consent',
    fileName: `Guardian_consent_${child}.txt`,
    mimeType: 'text/plain',
    size: text.length,
    uploadedAt: at,
    text,
    issuer: 'not-started',
    check: {
      status: 'passed',
      detectedKind: 'guardian-consent',
      checkedAt: at,
      extracted: [
        { label: 'Guardian', value: guardian },
        { label: 'Relationship', value: relationship },
        { label: 'Consented on', value: day },
      ],
      findings: [
        { label: 'Consent recorded in the app', ok: true, detail: `Given on ${day}` },
        { label: 'Guardian identity check', ok: true, detail: 'Passed' },
      ],
    },
  };
}
