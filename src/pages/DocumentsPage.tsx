import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, FolderLock, Inbox, PenLine, Share2, Trash, Upload } from 'lucide-react';
import type { DocumentKind, VaultDocument } from '../types';
import { useStudent } from '../hooks/useStudent';
import { useToast } from '../hooks/useToast';
import { useDocuments, type RequestView } from '../hooks/useDocuments';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader, EmptyState } from '../components/ui/Misc';
import { Button, ButtonLink } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CheckRunner } from '../components/verification/CheckRunner';
import { UploadDocumentModal } from '../components/documents/UploadDocumentModal';
import { CheckBadge, CheckFindings, DocumentPaper, IssuerBadge, ShareStatusPill, formatBytes } from '../components/documents/DocumentParts';
import { DOCUMENT_INFO, VAULT_ORDER } from '../data/documents';
import { checkMotivation, sampleMotivation } from '../intelligence/documentCheck';
import { institutionById } from '../data/institutions';
import { formatDate, daysUntil, relativeDays, timeAgo } from '../utils/dates';
import { makeId } from '../utils/createState';
import { cn } from '../utils/cn';

export default function DocumentsPage() {
  const { state, dispatch } = useStudent();
  const { requests, open, share, vault } = useDocuments();
  const notify = useToast();
  const location = useLocation();
  const [uploadKind, setUploadKind] = useState<DocumentKind | null>(null);
  const [afterUploadShare, setAfterUploadShare] = useState<string | null>(null);
  const [confirmShare, setConfirmShare] = useState<{ req: RequestView; doc: VaultDocument } | null>(null);
  const [issuerFor, setIssuerFor] = useState<VaultDocument | null>(null);
  const [writing, setWriting] = useState(false);
  const [viewing, setViewing] = useState<VaultDocument | null>(null);
  useDocumentTitle('Documents');

  const inst = institutionById(state.profile.preferredInstitutionIds[0] ?? '');
  // Guardian documents are only for under-18s.
  const vaultKinds = VAULT_ORDER.filter((k) => !DOCUMENT_INFO[k].guardianOnly || !state.profile.isAdult);

  const byKind = useMemo(() => Object.fromEntries(vault.map((d) => [d.kind, d])) as Partial<Record<DocumentKind, VaultDocument>>, [vault]);

  // Deep link from an award: /app/documents?upload=admission-letter&share=<shareId>
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (handled.current === location.search) return;
    handled.current = location.search;
    const p = new URLSearchParams(location.search);
    const k = p.get('upload') as DocumentKind | null;
    if (!k || !DOCUMENT_INFO[k]) return;
    const req = requests.find((r) => r.share.id === p.get('share'));
    const doc = byKind[k];
    if (req && doc && doc.check.status !== 'failed' && req.share.status === 'requested') setConfirmShare({ req, doc });
    else {
      // Written in the app, never uploaded.
      if (DOCUMENT_INFO[k].writeInApp) setWriting(true);
      else setUploadKind(k);
      setAfterUploadShare(p.get('share'));
    }
  }, [location.search, requests, byKind]);
  const sharedHistory = requests.filter((r) => r.share.snapshot);

  const startShare = (req: RequestView) => {
    const doc = byKind[req.share.kind];
    // A resubmission always needs a new upload, never the copy the sponsor already rejected.
    if (doc && doc.check.status !== 'failed' && req.share.status !== 'resubmit') setConfirmShare({ req, doc });
    else {
      if (DOCUMENT_INFO[req.share.kind].writeInApp) setWriting(true);
      else setUploadKind(req.share.kind);
      setAfterUploadShare(req.share.id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Upload once. Checked straight away. Share in one tap."
      />

      {/* Sponsor requests */}
      <section aria-labelledby="req-heading" className="mb-8">
        <h2 id="req-heading" className="mb-3 text-lg font-semibold">
          Requests from sponsors
        </h2>
        {open.length === 0 ? (
          <EmptyState icon={<Inbox aria-hidden className="size-5" />} title={sharedHistory.length ? 'Nothing to do right now' : 'No open requests'}>
            {sharedHistory.length
              ? 'Everything requested has been shared. You’ll get a notification here if a sponsor approves a document or asks for a new copy.'
              : 'When you accept a sponsor’s offer, the documents they need appear here.'}
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {open.map((r) => {
              const days = daysUntil(r.share.dueOn);
              return (
                <li key={r.share.id} className={cn('card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5', r.share.status === 'resubmit' && 'border-clay-100')}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{DOCUMENT_INFO[r.share.kind].label}</p>
                      <ShareStatusPill status={r.share.status} />
                    </div>
                    <p className="text-sm text-muted">
                      {r.sponsorName}, {r.fundName}. <span className={cn(days <= 5 && 'font-semibold text-clay-700')}>{relativeDays(days)}</span>
                    </p>
                    {r.share.reviewNote && <p className="mt-1 text-sm text-clay-700">Sponsor’s note: “{r.share.reviewNote}”</p>}
                    {r.share.note && !r.share.reviewNote && <p className="mt-1 text-sm text-body">“{r.share.note}”</p>}
                  </div>
                  <Button size="sm" icon={r.vaultDoc ? <Share2 aria-hidden className="size-4" /> : <Upload aria-hidden className="size-4" />} onClick={() => startShare(r)} className="shrink-0">
                    {r.vaultDoc && r.share.status !== 'resubmit' ? `Share ${DOCUMENT_INFO[r.share.kind].short.toLowerCase()} from vault` : 'Upload and share'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Vault */}
      <section aria-labelledby="vault-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="vault-heading" className="flex items-center gap-2 text-lg font-semibold">
            <FolderLock aria-hidden className="size-5 text-veld-600" /> Your vault
          </h2>
          <p className="text-sm text-muted">
            {vault.length} of {vaultKinds.length} documents added
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vaultKinds.map((kind) => {
            const doc = byKind[kind];
            const info = DOCUMENT_INFO[kind];
            return (
              <li key={kind} className="card flex flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-sans text-[0.9375rem] font-semibold">{info.label}</h3>
                    <p className="text-xs text-muted">{info.hint}</p>
                  </div>
                </div>
                {doc ? (
                  <>
                    <button type="button" onClick={() => setViewing(doc)} className="mt-3 block text-left" aria-label={`View ${doc.fileName}`}>
                      <DocumentPaper doc={doc} className="max-h-36" />
                    </button>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <CheckBadge status={doc.check.status} />
                      <IssuerBadge status={doc.issuer} kind={kind} />
                    </div>
                    <p className="mt-2 truncate text-xs text-muted">
                      {doc.fileName}, {formatBytes(doc.size)}, added {timeAgo(doc.uploadedAt).toLowerCase()}
                    </p>
                    <div className="mt-2">
                      <CheckFindings check={doc.check} compact />
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                      {info.issuerCheck && doc.issuer !== 'verified' && (
                        <Button size="sm" onClick={() => setIssuerFor(doc)}>
                          Confirm with {kind === 'latest-results' ? 'school' : inst?.shortName ?? 'institution'}
                        </Button>
                      )}
                      {!info.fromConsent && (
                        <Button size="sm" variant="secondary" onClick={() => (info.writeInApp ? setWriting(true) : setUploadKind(kind))}>
                          {info.writeInApp ? 'Edit' : 'Replace'}
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'removeDocument', id: doc.id });
                          notify(`${info.label} removed from your vault. Copies already shared stay with that sponsor.`, 'info');
                        }}
                        className="ml-auto grid size-9 place-items-center rounded-full text-muted hover:bg-clay-50 hover:text-clay-600"
                        aria-label={`Remove ${info.label}`}
                      >
                        <Trash aria-hidden className="size-4" />
                      </button>
                    </div>
                  </>
                ) : info.fromConsent ? (
                  <div className="mt-4 flex flex-1 flex-col justify-end">
                    <div className="mb-3 rounded-lg border border-dashed border-line-strong px-3 py-5 text-center text-xs text-subtle">Not given yet</div>
                    <ButtonLink to="/app/verify" size="sm" variant="secondary">
                      Get consent
                    </ButtonLink>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-1 flex-col justify-end">
                    <div className="mb-3 rounded-lg border border-dashed border-line-strong px-3 py-5 text-center text-xs text-subtle">Not added yet</div>
                    <Button size="sm" variant="secondary" icon={info.writeInApp ? <PenLine aria-hidden className="size-4" /> : <Upload aria-hidden className="size-4" />} onClick={() => (info.writeInApp ? setWriting(true) : setUploadKind(kind))}>
                      {info.writeInApp ? 'Write it here' : 'Add document'}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Transparency */}
      <section aria-labelledby="who-heading" className="mt-10">
        <h2 id="who-heading" className="flex items-center gap-2 text-lg font-semibold">
          <Eye aria-hidden className="size-5 text-veld-600" /> Who has your documents
        </h2>
        <p className="mt-0.5 text-sm text-muted">Every share is recorded. A sponsor only sees what you shared for their award.</p>
        {sharedHistory.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line-strong px-4 py-4 text-sm text-muted">You haven’t shared any documents yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
            {sharedHistory.map((r) => (
              <li key={r.share.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold text-ink">{DOCUMENT_INFO[r.share.kind].label}</span>
                  <span className="text-muted">
                    {' '}
                    shared with {r.sponsorName} on {formatDate(r.share.sharedAt!.slice(0, 10))}
                  </span>
                </span>
                <ShareStatusPill status={r.share.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <UploadDocumentModal
        kind={uploadKind}
        state={state}
        onClose={() => {
          setUploadKind(null);
          setAfterUploadShare(null);
        }}
        onSave={(doc) => {
          dispatch({ type: 'addDocument', document: doc });
          setUploadKind(null);
          notify(`${DOCUMENT_INFO[doc.kind].label} saved to your vault.`);
          const req = afterUploadShare ? requests.find((r) => r.share.id === afterUploadShare) : open.find((r) => r.share.kind === doc.kind);
          setAfterUploadShare(null);
          if (req) setConfirmShare({ req, doc });
        }}
      />

      <Modal
        open={Boolean(confirmShare)}
        onClose={() => setConfirmShare(null)}
        title={confirmShare ? `Share with ${confirmShare.req.sponsorName}?` : ''}
        description="They’ll see this one document for this award, inside the app. You can see every share on this page."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmShare(null)}>
              Cancel
            </Button>
            <Button
              icon={<Share2 aria-hidden className="size-4" />}
              onClick={() => {
                if (!confirmShare) return;
                share(confirmShare.req.share.id, confirmShare.doc);
                setConfirmShare(null);
              }}
            >
              Share document
            </Button>
          </>
        }
      >
        {confirmShare && (
          <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
            <DocumentPaper doc={confirmShare.doc} className="max-h-44" />
            <div className="text-sm">
              <p className="font-semibold text-ink">{confirmShare.doc.fileName}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <CheckBadge status={confirmShare.doc.check.status} />
                <IssuerBadge status={confirmShare.doc.issuer} kind={confirmShare.doc.kind} />
              </div>
              <p className="mt-3 text-muted">The sponsor also sees the automatic check results, so they can review it faster.</p>
            </div>
          </div>
        )}
      </Modal>

      {issuerFor && (
        <CheckRunner
          open
          title={`Confirm with ${issuerFor.kind === 'latest-results' ? 'your school' : inst?.shortName ?? 'the institution'}`}
          description="The issuer confirms the document is genuine. Sponsors approve confirmed documents much faster."
          steps={[
            { label: `Sending a confirmation request to ${issuerFor.kind === 'latest-results' ? 'the issuing school' : inst?.name ?? 'the institution'} through its verification service` },
            { label: 'Matching the reference number and your details', failLabel: 'The issuer has no record matching this document' },
            { label: 'Issuer confirmed the document (simulated)' },
          ]}
          onClose={() => setIssuerFor(null)}
          onResult={(ok) => {
            dispatch({ type: 'setDocumentIssuer', id: issuerFor.id, status: ok ? 'verified' : 'failed' });
            notify(
              ok
                ? issuerFor.kind === 'admission-letter'
                  ? 'Admission confirmed by the institution. Your offer is now verified too.'
                  : 'Document confirmed by the issuer.'
                : 'The issuer couldn’t confirm this document. Upload the original.',
              ok ? 'success' : 'info',
            );
          }}
        />
      )}

      <MotivationEditor
        open={writing}
        initial={byKind['motivation-letter']?.text ?? ''}
        onClose={() => {
          setWriting(false);
          setAfterUploadShare(null);
        }}
        onSave={(text) => {
          const check = checkMotivation(text, state);
          const doc: VaultDocument = {
              id: makeId('vault'),
              kind: 'motivation-letter',
              fileName: 'Motivation letter (written in the app)',
              mimeType: 'text/plain',
              size: new Blob([text]).size,
              uploadedAt: new Date().toISOString(),
              text: text.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email removed]').replace(/(\+27|\b0)\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g, '[number removed]'),
              check,
              issuer: 'not-started',
          };
          dispatch({ type: 'addDocument', document: doc });
          setWriting(false);
          notify('Motivation letter saved to your vault.');
          // Written for a sponsor's request: offer to share it straight away.
          const req = afterUploadShare ? requests.find((r) => r.share.id === afterUploadShare) : open.find((r) => r.share.kind === 'motivation-letter');
          setAfterUploadShare(null);
          if (req) setConfirmShare({ req, doc });
        }}
      />

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? DOCUMENT_INFO[viewing.kind].label : ''} description={viewing?.fileName} size="lg">
        {viewing && (
          <div className="grid gap-5 sm:grid-cols-[14rem_1fr]">
            <DocumentPaper doc={viewing} />
            <div>
              <div className="flex flex-wrap gap-1.5">
                <CheckBadge status={viewing.check.status} />
                <IssuerBadge status={viewing.issuer} kind={viewing.kind} />
              </div>
              <dl className="mt-3 grid gap-1 rounded-xl bg-paper p-3 text-xs">
                {viewing.check.extracted.map((e) => (
                  <div key={e.label} className="grid grid-cols-[6.5rem_1fr] gap-2">
                    <dt className="text-muted">{e.label}</dt>
                    <dd className="font-medium text-ink">{e.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3">
                <CheckFindings check={viewing.check} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const STARTER = `I want to study `;

function MotivationEditor({ open, initial, onClose, onSave }: { open: boolean; initial: string; onClose: () => void; onSave: (text: string) => void }) {
  const { state } = useStudent();
  const [text, setText] = useState(initial || STARTER);
  useEffect(() => {
    if (open) setText(initial || STARTER);
  }, [open, initial]);
  const check = checkMotivation(text, state);
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Motivation letter"
      description="Written and stored in the app. The assistant gives live feedback; sponsors only see it if you share it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => setText(sampleMotivation(state))}>
            Use a sample letter
          </Button>
          <Button onClick={() => onSave(text.trim())} disabled={check.status === 'failed'}>
            Save to vault
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-[1fr_15rem]">
        <div>
          <label htmlFor="motivation" className="sr-only">
            Motivation letter
          </label>
          <textarea
            id="motivation"
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm leading-relaxed focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
          />
        </div>
        <div className="rounded-xl bg-paper p-4" aria-live="polite">
          <p className="mb-2 text-xs font-semibold text-ink">Live feedback</p>
          <CheckFindings check={check} />
        </div>
      </div>
    </Modal>
  );
}
