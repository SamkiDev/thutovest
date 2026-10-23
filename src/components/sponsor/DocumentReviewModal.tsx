import { useState } from 'react';
import { BellRing, CircleCheck, FilePlus, PenLine, RotateCcw } from 'lucide-react';
import type { DocumentKind, DocumentShare, FundApplication } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Misc';
import { CheckBadge, CheckFindings, DocumentPaper, IssuerBadge, ShareStatusPill } from '../documents/DocumentParts';
import { FundingTimeline } from '../documents/FundingTimeline';
import { DOCUMENT_INFO, VAULT_ORDER } from '../../data/documents';
import { formatZAR } from '../../utils/format';
import { formatDate, relativeDays, daysUntil } from '../../utils/dates';
import { cn } from '../../utils/cn';
import { LIMITS } from '../../platform/authorize';

export function DocumentReviewModal({
  app,
  studentName,
  institution,
  shares,
  onClose,
  onReview,
  onConfirmIssuer,
  onRequest,
  onRemind,
  onApprove,
}: {
  app: FundApplication;
  studentName: string;
  institution: string;
  shares: DocumentShare[];
  onClose: () => void;
  onReview: (shareId: string, approve: boolean, note?: string) => void;
  onConfirmIssuer: (shareId: string) => void;
  onRequest: (kind: DocumentKind, note: string) => void;
  onRemind: (share: DocumentShare) => void;
  onApprove: () => void;
}) {
  const [resubmitFor, setResubmitFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [checking, setChecking] = useState<string | null>(null);
  const [reqKind, setReqKind] = useState<DocumentKind>('income-proof');
  const [reqNote, setReqNote] = useState('');
  const required = shares.filter((s) => s.required);
  const outstanding = required.filter((s) => s.status !== 'approved');
  const canApprove = app.status === 'accepted' && outstanding.length === 0;
  const requestable = VAULT_ORDER.filter((k) => !shares.some((s) => s.kind === k && s.status !== 'approved'));

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={`${studentName}’s documents`}
      description={`${formatZAR(app.amount ?? 0)} award, paid to ${institution} once every required document is approved.`}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {app.status !== 'accepted'
              ? 'Funding already approved.'
              : canApprove
                ? 'Every required document is approved.'
                : `${outstanding.length} required ${outstanding.length === 1 ? 'document' : 'documents'} still to approve.`}
          </p>
          <Button onClick={onApprove} disabled={!canApprove} icon={<CircleCheck aria-hidden className="size-4" />}>
            Approve funding
          </Button>
        </div>
      }
    >
      <FundingTimeline app={app} shares={shares} />
      {app.agreement && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-paper p-3 text-sm text-body">
          <PenLine aria-hidden className="size-4 shrink-0 text-veld-600" />
          Agreement signed in the app on {formatDate(app.agreement.signedAt.slice(0, 10))}
          {app.agreement.guardianName ? `, co-signed by guardian ${app.agreement.guardianName}` : ''}.
        </p>
      )}

      <ul className="mt-5 space-y-4">
        {shares.map((s) => {
          const snap = s.snapshot;
          return (
            <li key={s.id} className={cn('rounded-2xl border p-4', s.status === 'shared' ? 'border-veld-200' : 'border-line')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-sans text-[0.9375rem] font-semibold">
                  {DOCUMENT_INFO[s.kind].label}
                  {!s.required && <span className="ml-1.5 text-xs font-normal text-muted">Optional</span>}
                </h3>
                <ShareStatusPill status={s.status} />
              </div>
              {!snap ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper p-3 text-sm">
                  <span className="text-muted">
                    Waiting for {studentName}. {relativeDays(daysUntil(s.dueOn))}.
                    {s.reviewNote && <span className="block text-xs text-clay-700">Your note: “{s.reviewNote}”</span>}
                  </span>
                  <Button size="sm" variant="secondary" icon={<BellRing aria-hidden className="size-4" />} onClick={() => onRemind(s)}>
                    Send in-app reminder
                  </Button>
                </div>
              ) : (
                <div className="mt-3 grid gap-4 md:grid-cols-[10rem_1fr]">
                  <DocumentPaper doc={snap} className="max-h-48" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{snap.fileName}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <CheckBadge status={snap.check.status} />
                      <IssuerBadge status={snap.issuer} kind={s.kind} />
                    </div>
                    {snap.check.extracted.length > 0 && (
                      <dl className="mt-2 grid gap-0.5 text-xs">
                        {snap.check.extracted.map((e) => (
                          <div key={e.label} className="grid grid-cols-[6.5rem_1fr] gap-2">
                            <dt className="text-muted">{e.label}</dt>
                            <dd className="font-medium text-ink">{e.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <div className="mt-2">
                      <CheckFindings check={snap.check} compact />
                    </div>
                    {s.status === 'shared' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => onReview(s.id, true)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="secondary" icon={<RotateCcw aria-hidden className="size-4" />} onClick={() => { setResubmitFor(s.id); setReason(''); }}>
                          Ask for a new copy
                        </Button>
                        {DOCUMENT_INFO[s.kind].issuerCheck && snap.issuer !== 'verified' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={checking === s.id}
                            onClick={() => {
                              setChecking(s.id);
                              window.setTimeout(() => {
                                onConfirmIssuer(s.id);
                                setChecking(null);
                              }, 1200);
                            }}
                          >
                            {checking === s.id ? (
                              <>
                                <Spinner className="size-4" label="Confirming" /> Confirming with {s.kind === 'latest-results' ? 'school' : institution}
                              </>
                            ) : (
                              `Confirm with ${s.kind === 'latest-results' ? 'school' : institution}`
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                    {resubmitFor === s.id && (
                      <div className="mt-3 rounded-xl bg-paper p-3">
                        <label htmlFor={`reason-${s.id}`} className="mb-1 block text-xs font-semibold text-ink">
                          What’s wrong? {studentName} sees this note in the app.
                        </label>
                        <textarea maxLength={LIMITS.note}
                          id={`reason-${s.id}`}
                          rows={2}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. Please upload the final admission letter, not the provisional one."
                          className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
                        />
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            disabled={reason.trim().length < 5}
                            onClick={() => {
                              onReview(s.id, false, reason.trim());
                              setResubmitFor(null);
                            }}
                          >
                            Send request
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setResubmitFor(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {requestable.length > 0 && (
        <section className="mt-5 rounded-2xl border border-dashed border-line-strong p-4" aria-labelledby="req-more">
          <h3 id="req-more" className="flex items-center gap-2 font-sans text-sm font-semibold">
            <FilePlus aria-hidden className="size-4 text-veld-600" /> Request another document
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-[14rem_1fr_auto] sm:items-end">
            <div>
              <label htmlFor="req-kind" className="mb-1 block text-xs font-semibold text-ink">
                Document
              </label>
              <select id="req-kind" value={reqKind} onChange={(e) => setReqKind(e.target.value as DocumentKind)} className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm">
                {requestable.map((k) => (
                  <option key={k} value={k}>
                    {DOCUMENT_INFO[k].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="req-note" className="mb-1 block text-xs font-semibold text-ink">
                Note for {studentName} (optional)
              </label>
              <input id="req-note" value={reqNote} onChange={(e) => setReqNote(e.target.value)} className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm" />
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onRequest(requestable.includes(reqKind) ? reqKind : requestable[0], reqNote.trim());
                setReqNote('');
              }}
            >
              Request in app
            </Button>
          </div>
        </section>
      )}
    </Modal>
  );
}
