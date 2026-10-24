import { BadgeCheck, CircleAlert, CircleCheck, CircleX, Clock3, FileText } from 'lucide-react';
import type { DocumentCheck, DocumentKind, ShareStatus, VaultDocument, VerificationStatus } from '../../types';
import { DOCUMENT_INFO } from '../../data/documents';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/dates';

type DocLike = Pick<VaultDocument, 'kind' | 'fileName' | 'mimeType' | 'size' | 'previewDataUrl' | 'text' | 'isSample' | 'check' | 'issuer'>;

/** A visual preview: the real thumbnail for photos, a typed paper for written letters, or a summary sheet for PDFs. */
export function DocumentPaper({ doc, className }: { doc: DocLike; className?: string }) {
  if (doc.previewDataUrl) {
    return <img src={doc.previewDataUrl} alt={`Preview of ${doc.fileName}`} className={cn('w-full rounded-lg border border-line object-cover object-top', className)} />;
  }
  if (doc.text) {
    return (
      <div className={cn('rounded-lg border border-line bg-white p-4 text-[0.6875rem] leading-relaxed text-ink shadow-sm', className)}>
        <p className="mb-1 font-semibold">{DOCUMENT_INFO[doc.kind].label}</p>
        <p className="line-clamp-[8] whitespace-pre-line text-body">{doc.text}</p>
      </div>
    );
  }
  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-line bg-white p-4 text-ink shadow-sm', className)} aria-label={`${DOCUMENT_INFO[doc.kind].label}: ${doc.fileName}`} role="img">
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <FileText aria-hidden className="size-4 text-muted" />
        <p className="truncate text-[0.6875rem] font-semibold">{DOCUMENT_INFO[doc.kind].label}</p>
      </div>
      <dl className="mt-2 space-y-1 text-[0.6875rem]">
        {doc.check.extracted.slice(0, 4).map((e) => (
          <div key={e.label} className="grid grid-cols-[5.5rem_1fr] gap-2">
            <dt className="text-subtle">{e.label}</dt>
            <dd className="truncate font-medium">{e.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 space-y-1" aria-hidden>
        <div className="h-1.5 w-11/12 rounded bg-sunken" />
        <div className="h-1.5 w-9/12 rounded bg-sunken" />
        <div className="h-1.5 w-10/12 rounded bg-sunken" />
      </div>
      {doc.isSample && <span className="absolute top-2 right-2 rounded bg-amber-50 px-1.5 py-0.5 text-[0.625rem] font-semibold text-amber-800">Sample</span>}
    </div>
  );
}

const CHECK_TONE = {
  passed: { label: 'Check passed', cls: 'bg-veld-50 text-veld-700', Icon: CircleCheck },
  warning: { label: 'Check passed with notes', cls: 'bg-amber-50 text-amber-800', Icon: CircleAlert },
  failed: { label: 'Check failed', cls: 'bg-clay-50 text-clay-700', Icon: CircleX },
} as const;

export function CheckBadge({ status }: { status: DocumentCheck['status'] }) {
  const t = CHECK_TONE[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', t.cls)}>
      <t.Icon aria-hidden className="size-3.5" />
      {t.label}
    </span>
  );
}

export function IssuerBadge({ status, kind }: { status: VerificationStatus; kind: DocumentKind }) {
  if (!DOCUMENT_INFO[kind].issuerCheck) return null;
  const map = {
    verified: { label: 'Confirmed by issuer', cls: 'bg-veld-600 text-white', Icon: BadgeCheck },
    pending: { label: 'Waiting for issuer', cls: 'bg-amber-50 text-amber-800', Icon: Clock3 },
    failed: { label: 'Issuer could not confirm', cls: 'bg-clay-50 text-clay-700', Icon: CircleX },
    'not-started': { label: 'Not yet confirmed by issuer', cls: 'bg-sunken text-muted', Icon: Clock3 },
  } as const;
  const m = map[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', m.cls)}>
      <m.Icon aria-hidden className="size-3.5" />
      {m.label}
    </span>
  );
}

export function CheckFindings({ check, compact = false }: { check: DocumentCheck; compact?: boolean }) {
  const list = compact ? check.findings.filter((f) => !f.ok) : check.findings;
  if (list.length === 0) return compact ? <p className="text-xs text-veld-700">No issues found.</p> : null;
  return (
    <ul className="space-y-1 text-xs">
      {list.map((f) => (
        <li key={f.label} className={cn('flex gap-1.5', f.ok ? 'text-body' : f.severity === 'error' ? 'text-clay-700' : 'text-amber-800')}>
          {f.ok ? (
            <CircleCheck aria-hidden className="mt-px size-3.5 shrink-0 text-veld-600" />
          ) : f.severity === 'error' ? (
            <CircleX aria-hidden className="mt-px size-3.5 shrink-0" />
          ) : (
            <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
          )}
          <span>
            <span className="font-semibold">{f.label}</span>
            {f.detail ? `: ${f.detail}` : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

export const SHARE_STATUS: Record<ShareStatus, { label: string; cls: string }> = {
  requested: { label: 'Requested', cls: 'bg-amber-50 text-amber-800' },
  shared: { label: 'Shared, in review', cls: 'bg-ink-100 text-ink' },
  approved: { label: 'Approved', cls: 'bg-veld-50 text-veld-700' },
  resubmit: { label: 'New copy needed', cls: 'bg-clay-50 text-clay-700' },
};

export function ShareStatusPill({ status }: { status: ShareStatus }) {
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap', SHARE_STATUS[status].cls)}>{SHARE_STATUS[status].label}</span>;
}

export function formatBytes(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1000))} KB`;
}

export function dueLabel(iso: string) {
  return `Due ${formatDate(iso)}`;
}
