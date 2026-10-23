import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { FileUp, ScanText } from 'lucide-react';
import type { DocumentCheck, DocumentKind, StudentState, VaultDocument } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Misc';
import { CheckBadge, CheckFindings, DocumentPaper, formatBytes } from './DocumentParts';
import { ACCEPTED_TYPES, DOCUMENT_INFO, MAX_FILE_BYTES, sniffFileType } from '../../data/documents';
import { checkDocument, sampleFile, type FileFacts } from '../../intelligence/documentCheck';
import { institutionById } from '../../data/institutions';
import { makeId } from '../../utils/createState';

const STEPS = ['Reading the document', 'Checking it’s the right document', 'Matching it to your profile', 'Looking for signs of editing'];

/** Shrinks a photo to a small JPEG preview so it fits in browser storage. */
function makeThumbnail(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 520 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      try {
        resolve(c.toDataURL('image/jpeg', 0.6));
      } catch {
        resolve(undefined);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    img.src = url;
  });
}

export function UploadDocumentModal({
  kind,
  state,
  onClose,
  onSave,
}: {
  kind: DocumentKind | null;
  state: StudentState;
  onClose: () => void;
  onSave: (doc: VaultDocument) => void;
}) {
  const [facts, setFacts] = useState<(FileFacts & { preview?: string; isSample?: boolean }) | null>(null);
  const [tamper, setTamper] = useState(false);
  const [phase, setPhase] = useState<'pick' | 'checking' | 'done'>('pick');
  const [step, setStep] = useState(0);
  const [check, setCheck] = useState<DocumentCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!kind) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setFacts(null);
      setPhase('pick');
      setCheck(null);
      setError(null);
      setTamper(false);
    }
  }, [kind]);

  if (!kind) return null;
  const info = DOCUMENT_INFO[kind];

  const run = (f: FileFacts) => {
    setPhase('checking');
    setStep(0);
    const tick = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 450;
    STEPS.forEach((_, i) => timers.current.push(window.setTimeout(() => setStep(i + 1), tick * (i + 1))));
    timers.current.push(
      window.setTimeout(() => {
        setCheck(checkDocument(kind, f, state, { simulateTamper: tamper }));
        setPhase('done');
      }, tick * (STEPS.length + 1)),
    );
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError('That file is larger than 8 MB. Take a photo of the document instead.');
      return;
    }
    if (file.size === 0) {
      setError('That file is empty. Choose the document again.');
      return;
    }
    const sniffed = await sniffFileType(file);
    if (!sniffed || (file.type && !ACCEPTED_TYPES.includes(file.type))) {
      setError('Upload a PDF or a photo (JPG, PNG, WEBP or HEIC). Other file types are not accepted.');
      return;
    }
    setError(null);
    // ID copies are never kept as an image preview: the check runs, and only the result is stored.
    const preview = kind === 'id-copy' ? undefined : await makeThumbnail(file);
    const safeName = file.name.replace(/[^\p{L}\p{N} ._()-]/gu, '_').slice(0, 120);
    const f = { fileName: safeName, mimeType: file.type || `application/${sniffed}`, size: file.size, preview };
    setFacts(f);
    run(f);
  };

  const useSample = () => {
    const inst = institutionById(state.profile.preferredInstitutionIds[0] ?? '')?.shortName;
    const f = { ...sampleFile(kind, state.profile.firstName, inst), isSample: true };
    setFacts(f);
    run(f);
  };

  const save = () => {
    if (!facts || !check) return;
    onSave({
      id: makeId('vault'),
      kind,
      fileName: facts.fileName,
      mimeType: facts.mimeType,
      size: facts.size,
      uploadedAt: new Date().toISOString(),
      previewDataUrl: facts.preview,
      isSample: facts.isSample,
      check,
      issuer: 'not-started',
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Add ${info.label.toLowerCase()}`}
      description={info.hint}
      size="lg"
      footer={
        phase === 'done' ? (
          <>
            <Button variant="ghost" onClick={() => { setPhase('pick'); setFacts(null); setCheck(null); }}>
              Choose another file
            </Button>
            <Button onClick={save} disabled={check?.status === 'failed'}>
              {check?.status === 'failed' ? 'Can’t save a failed document' : 'Save to my vault'}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )
      }
    >
      {phase === 'pick' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line-strong bg-paper px-4 py-8 text-center hover:border-veld-400 hover:bg-veld-50/40"
          >
            <FileUp aria-hidden className="size-8 text-veld-600" />
            <span className="font-semibold text-ink">Take a photo or choose a file</span>
            <span className="text-xs text-muted">PDF, JPG or PNG, up to 8 MB. It stays in your vault until you choose to share it.</span>
          </button>
          <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/heic" capture="environment" onChange={onFile} className="sr-only" aria-label={`Upload ${info.label}`} />
          {error && (
            <p role="alert" className="rounded-xl bg-clay-50 p-3 text-sm text-clay-700">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-ink-300 p-3">
            <p className="text-xs text-muted">No document handy? Use a sample file to try the flow.</p>
            <Button size="sm" variant="secondary" onClick={useSample}>
              Use a sample file
            </Button>
          </div>
          <label className="flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" checked={tamper} onChange={(e) => setTamper(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-clay-500)]" />
            <span>
              <strong className="text-ink">Demo:</strong> simulate an edited document, to see how forgeries are caught.
            </span>
          </label>
        </div>
      )}

      {phase === 'checking' && facts && (
        <div className="space-y-3" aria-live="polite">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ScanText aria-hidden className="size-4 text-veld-600" /> Checking {facts.fileName}
          </p>
          <ol className="space-y-2">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                {i < step ? <span className="grid size-5 place-items-center rounded-full bg-veld-600 text-[0.625rem] text-white">✓</span> : i === step ? <Spinner className="size-5 text-veld-600" label={s} /> : <span className="size-5 rounded-full border-2 border-line-strong" />}
                <span className={i <= step ? 'text-ink' : 'text-muted'}>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {phase === 'done' && facts && check && (
        <div className="grid gap-5 sm:grid-cols-[11rem_1fr]">
          <DocumentPaper
            doc={{ kind, fileName: facts.fileName, mimeType: facts.mimeType, size: facts.size, previewDataUrl: facts.preview, isSample: facts.isSample, check, issuer: 'not-started' }}
            className="max-h-60"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CheckBadge status={check.status} />
              <span className="text-xs text-muted">{formatBytes(facts.size)}</span>
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-ink">{facts.fileName}</p>
            {check.extracted.length > 0 && (
              <dl className="mt-3 grid gap-1 rounded-xl bg-paper p-3 text-xs">
                <p className="mb-1 font-semibold text-ink">Read from the document</p>
                {check.extracted.map((e) => (
                  <div key={e.label} className="grid grid-cols-[6.5rem_1fr] gap-2">
                    <dt className="text-muted">{e.label}</dt>
                    <dd className="font-medium text-ink">{e.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-3">
              <CheckFindings check={check} />
            </div>
            {check.status === 'failed' && <p className="mt-3 text-xs text-clay-700">This file can’t be used. Upload the original document. Edited documents are never sent to sponsors.</p>}
          </div>
        </div>
      )}
    </Modal>
  );
}
