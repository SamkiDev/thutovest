import { useState } from 'react';
import { BadgeCheck, CircleCheck, CircleX, Clock3, Eye, Lock, ShieldCheck } from 'lucide-react';
import type { StudentCheckKey, TrustLevel } from '../types';
import { useStudent } from '../hooks/useStudent';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { CheckRunner, type CheckStep } from '../components/verification/CheckRunner';
import { CheckChips, TrustBadge } from '../components/verification/TrustBadge';
import { STUDENT_CHECKS, TRUST_HINT, TRUST_LABEL, contactBlockers, studentChecks, studentTrust } from '../utils/trust';
import { liveCandidate } from '../intelligence/marketplace';
import { fieldLabel } from '../utils/matching';
import { formatZAR } from '../utils/format';
import { institutionById } from '../data/institutions';
import { timeAgo } from '../utils/dates';
import { cn } from '../utils/cn';
import { guardianConsentDocument, guardianConsentStatement } from '../platform/guardianRules';

function stepsFor(key: StudentCheckKey, guardianName: string, institution: string): CheckStep[] {
  switch (key) {
    case 'identity':
      return [
        { label: 'Reading your ID document' },
        { label: 'Checking the document’s security features' },
        { label: 'Matching your selfie to the ID photo', failLabel: 'Selfie did not match the ID photo' },
        { label: 'Liveness check' },
        { label: 'Confirming the record with Home Affairs (simulated)' },
      ];
    case 'enrolment':
      return [
        { label: `Sending a confirmation request to ${institution}` },
        { label: 'Matching your offer reference', failLabel: 'Offer reference not found at the institution' },
        { label: `${institution} confirmed your offer (simulated)` },
      ];
    case 'results':
      return [
        { label: 'Reading your results document' },
        { label: 'Checking the school and exam number', failLabel: 'Results don’t match the school’s record' },
        { label: 'Confirmed with the issuing school (simulated)' },
      ];
    case 'income':
      return [
        { label: 'Recording your household’s consent' },
        { label: 'Checking payslips or SASSA letter', failLabel: 'A document appears to have been edited' },
        { label: 'Confirming your income band' },
      ];
    case 'guardian':
      return [
        { label: `${guardianName || 'Your guardian'} confirms on this device` },
        { label: 'Guardian ID and selfie check', failLabel: 'Guardian identity could not be confirmed' },
        { label: 'Consent recorded in the app' },
      ];
  }
}

const LADDER: TrustLevel[] = [0, 1, 2, 3];

export default function VerifyPage() {
  const { state, dispatch } = useStudent();
  const notify = useToast();
  const [running, setRunning] = useState<StudentCheckKey | null>(null);
  const [gName, setGName] = useState(state.verification.guardianName ?? '');
  const [gRel, setGRel] = useState(state.verification.guardianRelationship ?? 'Mother');
  const [gError, setGError] = useState<string | null>(null);
  const [gAgreed, setGAgreed] = useState(false);
  const consentText = guardianConsentStatement(state.profile.firstName, gName.trim(), gRel);
  useDocumentTitle('Verification');

  const trust = studentTrust(state);
  const blockers = contactBlockers(state);
  const me = liveCandidate(state);
  const instName = institutionById(state.profile.preferredInstitutionIds[0] ?? '')?.shortName ?? 'your institution';
  const hasOffer = state.profile.applicationProgress === 'accepted' || state.profile.educationStage === 'first-year' || state.profile.educationStage === 'continuing';

  const checks = STUDENT_CHECKS.filter((c) => c.key !== 'guardian' || !state.profile.isAdult);
  const current = running ? STUDENT_CHECKS.find((c) => c.key === running)! : null;

  const startGuardian = () => {
    if (!gName.trim()) {
      setGError('Enter your parent or guardian’s first name.');
      return;
    }
    if (!gAgreed) {
      setGError('Your parent or guardian must read the consent and tick the box.');
      return;
    }
    setGError(null);
    dispatch({ type: 'setGuardian', name: gName.trim(), relationship: gRel });
    setRunning('guardian');
  };

  return (
    <div>
      <PageHeader
        title="Verification"
        description="Verified people only. Checks keep scams out."
      />

      <section className="card overflow-hidden" aria-labelledby="level-heading">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 id="level-heading" className="font-sans text-sm font-semibold text-muted">
              Your verification level
            </h2>
            <p className="mt-2 flex items-center gap-3">
              <span className="font-display text-3xl font-bold text-ink">{TRUST_LABEL[trust]}</span>
            </p>
            <p className="mt-1 text-sm text-body">{TRUST_HINT[trust]}</p>
            {blockers.length > 0 ? (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Before sponsors can contact you: {blockers.join(', ').toLowerCase()}.</p>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-veld-700">
                <CircleCheck aria-hidden className="size-4" /> Verified sponsors can find and contact you.
              </p>
            )}
          </div>
          <ol className="grid grid-cols-4 gap-1.5 self-center" aria-label="Verification levels">
            {LADDER.map((l) => (
              <li key={l} className={cn('rounded-xl border p-3 text-center sm:p-3', l <= trust ? 'border-veld-500 bg-veld-50' : 'border-line bg-paper')} aria-current={l === trust ? 'step' : undefined}>
                <span className={cn('mx-auto grid size-7 place-items-center rounded-full text-xs font-bold', l <= trust ? 'bg-veld-600 text-white' : 'bg-sunken text-muted')}>{l}</span>
                <span className={cn('mt-1.5 block text-[0.6875rem] font-semibold sm:text-xs', l <= trust ? 'text-ink' : 'text-muted')}>{TRUST_LABEL[l]}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="checks-heading">
          <h2 id="checks-heading" className="mb-3 text-lg font-semibold">
            Checks
          </h2>
          <ul className="space-y-3">
            {checks.map((c) => {
              const item = state.verification[c.key];
              const disabled = c.key === 'enrolment' && !hasOffer;
              return (
                <li key={c.key} className="card p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-sans text-[0.9375rem] font-semibold">{c.title}</h3>
                        <StatusPill status={item.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted">{c.detail}</p>
                      {item.status === 'verified' && item.updatedAt && <p className="mt-1 text-xs text-subtle">Verified {timeAgo(item.updatedAt).toLowerCase()}</p>}
                      {item.status === 'failed' && item.note && <p className="mt-1 text-xs font-medium text-clay-600">{item.note}</p>}
                      {disabled && <p className="mt-1 text-xs text-subtle">Available once you’ve accepted an offer.</p>}
                      <details className="mt-2 text-xs text-muted">
                        <summary className="cursor-pointer font-semibold text-veld-700">How this works in production</summary>
                        <p className="mt-1">{c.production}</p>
                      </details>
                    </div>
                    {c.key === 'guardian' && item.status !== 'verified' ? null : (
                      item.status !== 'verified' && (
                        <Button size="sm" variant={item.status === 'failed' ? 'secondary' : 'primary'} disabled={disabled} onClick={() => setRunning(c.key)} className="shrink-0">
                          {item.status === 'failed' ? 'Try again' : 'Verify now'}
                        </Button>
                      )
                    )}
                  </div>
                  {c.key === 'guardian' && item.status !== 'verified' && (
                    <div className="mt-4 grid gap-3 rounded-xl bg-paper p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
                      <div>
                        <label htmlFor="g-name" className="mb-1 block text-xs font-semibold text-ink">
                          Parent or guardian’s first name
                        </label>
                        <input
                          id="g-name"
                          value={gName}
                          onChange={(e) => setGName(e.target.value)}
                          aria-invalid={gError ? true : undefined}
                          className={cn('h-10 w-full rounded-xl border bg-surface px-3 text-sm focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none', gError ? 'border-clay-500' : 'border-line-strong')}
                        />
                      </div>
                      <div>
                        <label htmlFor="g-rel" className="mb-1 block text-xs font-semibold text-ink">
                          Relationship
                        </label>
                        <select id="g-rel" value={gRel} onChange={(e) => setGRel(e.target.value)} className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm">
                          {['Mother', 'Father', 'Grandparent', 'Aunt or uncle', 'Legal guardian'].map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <Button size="sm" onClick={startGuardian}>
                        Guardian consents now
                      </Button>
                      <div className="sm:col-span-3">
                        <p className="rounded-lg bg-surface p-3 text-sm text-body">{consentText}</p>
                        <label className="mt-2 flex items-start gap-2 text-sm text-body">
                          <input
                            type="checkbox"
                            checked={gAgreed}
                            onChange={(e) => {
                              setGAgreed(e.target.checked);
                              setGError(null);
                            }}
                            className="mt-0.5 size-4 shrink-0 accent-[var(--color-veld-600)]"
                          />
                          <span>I am {state.profile.firstName}’s parent or legal guardian, and I agree.</span>
                        </label>
                      </div>
                      {gError && <p className="text-xs font-medium text-clay-600 sm:col-span-3">{gError}</p>}
                    </div>
                  )}
                  {c.key === 'guardian' && item.status === 'verified' && state.verification.guardianName && (
                    <p className="mt-2 text-sm text-body">
                      {state.verification.guardianName} ({state.verification.guardianRelationship?.toLowerCase()}) can see your sponsor messages and must approve any offer with you.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="space-y-5">
          <section className="card p-5" aria-labelledby="disc-heading">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="disc-heading" className="text-base font-semibold">
                  Sponsor discovery
                </h2>
                <p className="mt-0.5 text-sm text-muted">Let verified sponsors find your anonymised profile and invite you to apply.</p>
              </div>
              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <span className="sr-only">Allow sponsor discovery</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={state.discoverable}
                  onChange={(e) => {
                    dispatch({ type: 'setDiscoverable', value: e.target.checked });
                    notify(e.target.checked ? 'Sponsor discovery is on.' : 'Sponsor discovery is off. Sponsors can no longer find you.', 'info');
                  }}
                  className="peer sr-only"
                />
                <span className="h-7 w-12 rounded-full bg-line-strong transition-colors peer-checked:bg-veld-600 peer-focus-visible:ring-3 peer-focus-visible:ring-veld-200" />
                <span className="absolute left-1 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
            <div className="mt-4 rounded-xl border border-line bg-paper p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Eye aria-hidden className="size-3.5" /> What sponsors see
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-ink">{me.firstName}</p>
              <p className="text-sm text-muted">
                {fieldLabel(me.field)}, {me.province}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TrustBadge level={me.trust} />
                <CheckChips checks={studentChecks(state.verification)} isAdult={state.profile.isAdult} />
              </div>
              <p className="mt-2 text-sm text-body">
                Estimated gap <strong className="num">{formatZAR(me.gap)}</strong>
              </p>
              <p className="mt-3 text-xs text-subtle">Never shown: surname, ID number, address, phone, email or documents.</p>
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5 text-sm" aria-labelledby="privacy-heading">
            <h2 id="privacy-heading" className="flex items-center gap-2 text-base font-semibold">
              <Lock aria-hidden className="size-4" /> Your data
            </h2>
            <ul className="mt-3 space-y-2 text-body">
              <li className="flex gap-2"><ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-veld-600" />Checks keep the result, not your documents.</li>
              <li className="flex gap-2"><ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-veld-600" />Sponsors only see the anonymised card above.</li>
              <li className="flex gap-2"><ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-veld-600" />Under-18s need a guardian before any sponsor contact.</li>
              <li className="flex gap-2"><BadgeCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-veld-600" />Built to follow POPIA: consent first, minimum data, delete on request.</li>
            </ul>
          </section>
        </aside>
      </div>

      {current && (
        <CheckRunner
          open
          title={`Verify: ${current.title.toLowerCase()}`}
          description={current.detail}
          steps={stepsFor(current.key, gName || state.verification.guardianName || '', instName)}
          onClose={() => setRunning(null)}
          onResult={(ok, failed) => {
            const before = trust;
            dispatch({
              type: 'setVerification',
              key: current.key,
              item: ok ? { status: 'verified', note: 'Passed' } : { status: 'failed', note: failed },
              log: ok ? `${current.title} verified` : `${current.title} check failed: ${failed}`,
            });
            if (ok && current.key === 'guardian') {
              const at = new Date().toISOString();
              const name = gName.trim() || state.verification.guardianName || 'Guardian';
              const text = guardianConsentStatement(state.profile.firstName, name, gRel);
              dispatch({ type: 'recordGuardianConsent', text, at, document: guardianConsentDocument(state.profile.firstName, name, gRel, text, at) });
            }
            if (ok) {
              const after = studentTrust({ ...state, verification: { ...state.verification, [current.key]: { status: 'verified' } } });
              notify(after > before ? `${current.title} verified. You’re now “${TRUST_LABEL[after]}”.` : `${current.title} verified.`);
            } else notify(`${current.title} check failed. Nothing was shared.`, 'info');
          }}
        />
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof CircleCheck }> = {
    verified: { label: 'Verified', cls: 'bg-veld-50 text-veld-700', Icon: CircleCheck },
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-800', Icon: Clock3 },
    failed: { label: 'Failed', cls: 'bg-clay-50 text-clay-700', Icon: CircleX },
    'not-started': { label: 'Not verified', cls: 'bg-sunken text-muted', Icon: Clock3 },
  };
  const m = map[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', m.cls)}>
      <m.Icon aria-hidden className="size-3.5" />
      {m.label}
    </span>
  );
}
