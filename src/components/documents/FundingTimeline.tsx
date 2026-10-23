import { Check } from 'lucide-react';
import type { DocumentShare, FundApplication } from '../../types';
import { cn } from '../../utils/cn';

/** Offer → Signed → Documents → Approved → Paid → Results, shared by student and sponsor views. */
export function FundingTimeline({ app, shares, className }: { app: FundApplication; shares: DocumentShare[]; className?: string }) {
  const required = shares.filter((s) => s.required && s.kind !== 'semester-results');
  const approvedDocs = required.filter((s) => s.status === 'approved').length;
  const order = ['offered', 'accepted', 'approved', 'paid'];
  const at = order.indexOf(app.status);
  const results = shares.some((s) => s.kind === 'semester-results' && s.status === 'approved');
  const steps = [
    { label: 'Offer', done: at >= 0 },
    { label: 'Signed', done: at >= 1 },
    { label: `Documents ${approvedDocs}/${required.length}`, done: at >= 2 || (required.length > 0 && approvedDocs === required.length) },
    { label: 'Approved', done: at >= 2 },
    { label: 'Paid', done: at >= 3 },
    { label: 'Results', done: results },
  ];
  const current = steps.findIndex((s) => !s.done);
  return (
    <ol className={cn('grid grid-cols-6 gap-1', className)} aria-label="Funding progress">
      {steps.map((s, i) => (
        <li key={s.label} className="flex flex-col items-center text-center" aria-current={i === current ? 'step' : undefined}>
          <span
            className={cn(
              'grid size-6 place-items-center rounded-full border-2 text-[0.625rem] font-bold',
              s.done ? 'border-veld-600 bg-veld-600 text-white' : i === current ? 'border-veld-500 bg-surface text-veld-700' : 'border-line-strong bg-surface text-subtle',
            )}
          >
            {s.done ? <Check aria-hidden className="size-3" strokeWidth={3.5} /> : i + 1}
          </span>
          <span className={cn('mt-1 text-[0.625rem] leading-tight font-semibold sm:text-[0.6875rem]', s.done || i === current ? 'text-ink' : 'text-muted')}>
            {s.label}
            <span className="sr-only">{s.done ? ', done' : i === current ? ', current step' : ', to do'}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
