import { useState } from 'react';
import { PenLine, ShieldCheck } from 'lucide-react';
import type { DocumentKind, FundApplication, FundingAgreement } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { DOCUMENT_INFO, fundingTerms } from '../../data/documents';
import { formatZAR } from '../../utils/format';

/** Accepting an offer = signing the funding agreement in the app (with guardian co-signature for under-18s). */
export function SignAgreementModal({
  app,
  sponsorName,
  fundName,
  institution,
  requiredDocs,
  firstName,
  isAdult,
  guardianName,
  onClose,
  onSign,
}: {
  app: FundApplication | null;
  sponsorName: string;
  fundName: string;
  institution: string;
  requiredDocs: DocumentKind[];
  firstName: string;
  isAdult: boolean;
  guardianName?: string;
  onClose: () => void;
  onSign: (agreement: FundingAgreement) => void;
}) {
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [guardianOk, setGuardianOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!app) return null;
  const terms = fundingTerms(sponsorName, formatZAR(app.amount ?? 0), institution, requiredDocs.map((k) => DOCUMENT_INFO[k].label.toLowerCase()));

  const sign = () => {
    if (!name.trim().toLowerCase().startsWith(firstName.toLowerCase()) || name.trim().split(/\s+/).length < 2) {
      setError(`Type your full name, starting with ${firstName}, to sign.`);
      return;
    }
    if (!agree) {
      setError('Tick the box to confirm you agree to the terms.');
      return;
    }
    if (!isAdult && !guardianOk) {
      setError(`${guardianName ?? 'Your guardian'} needs to co-sign on this device.`);
      return;
    }
    const now = new Date().toISOString();
    onSign({ signedName: name.trim(), signedAt: now, guardianName: isAdult ? undefined : guardianName, guardianSignedAt: isAdult ? undefined : now, terms });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Accept and sign"
      description={`${sponsorName}: ${formatZAR(app.amount ?? 0)} from ${fundName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Not yet
          </Button>
          <Button icon={<PenLine aria-hidden className="size-4" />} onClick={sign}>
            Sign and accept
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {app.offerNote && <p className="rounded-xl bg-paper p-3 text-sm text-body">“{app.offerNote}”</p>}
        <section aria-labelledby="terms-h">
          <h3 id="terms-h" className="font-sans text-sm font-semibold text-ink">
            Funding agreement
          </h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-body">
            {terms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </section>
        <section className="rounded-xl border border-line p-4" aria-labelledby="docs-h">
          <h3 id="docs-h" className="font-sans text-sm font-semibold text-ink">
            Documents you’ll share in the app
          </h3>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {requiredDocs.map((k) => (
              <li key={k} className="rounded-full bg-sunken px-3 py-0.5 text-xs font-semibold text-ink">
                {DOCUMENT_INFO[k].label}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Upload them to your vault and share in one tap. Nothing is sent by email.</p>
        </section>
        <div>
          <label htmlFor="sig-name" className="mb-1.5 block text-sm font-semibold text-ink">
            Type your full name to sign
          </label>
          <input
            id="sig-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            autoComplete="name"
            placeholder={`${firstName} …`}
            className="h-12 w-full rounded-xl border border-line-strong bg-surface px-4 font-display text-lg italic focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted">Your surname is stored with the agreement only. The sponsor sees “{firstName}” plus your signature date.</p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-veld-600)]" />I have read the agreement and accept the award.
        </label>
        {!isAdult && (
          <label className="flex items-start gap-2 rounded-xl bg-paper p-3 text-sm">
            <input type="checkbox" checked={guardianOk} onChange={(e) => setGuardianOk(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-veld-600)]" />
            <span>
              <span className="flex items-center gap-1.5 font-semibold text-ink">
                <ShieldCheck aria-hidden className="size-4 text-veld-600" /> Guardian co-signature
              </span>
              {guardianName ?? 'Your guardian'} confirms on this device that they agree. Their identity was checked when they gave consent.
            </span>
          </label>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-clay-50 p-3 text-sm text-clay-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
