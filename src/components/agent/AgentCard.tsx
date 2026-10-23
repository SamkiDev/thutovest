import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, BellRing, ChevronDown, CircleCheck, FilePenLine, Handshake, ChartLine, RefreshCcw, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RouteMark } from '../layout/Logo';
import type { AgentItem } from '../../types';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

const ICON: Record<AgentItem['kind'], LucideIcon> = {
  prepared: FilePenLine,
  replan: RefreshCcw,
  reminder: BellRing,
  match: Handshake,
  warning: ShieldAlert,
  forecast: ChartLine,
  document: FileText,
};

const TONE: Record<AgentItem['kind'], string> = {
  prepared: 'bg-veld-50 text-veld-700',
  replan: 'bg-ink-100 text-ink',
  reminder: 'bg-sunken text-muted',
  match: 'bg-veld-50 text-veld-700',
  warning: 'bg-clay-50 text-clay-600',
  forecast: 'bg-amber-50 text-amber-700',
  document: 'bg-amber-50 text-amber-700',
};

export function AgentCard({
  item,
  onApprove,
  onDismiss,
  compact = false,
}: {
  item: AgentItem;
  onApprove: (i: AgentItem) => void;
  onDismiss: (i: AgentItem) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const Icon = ICON[item.kind];
  const waiting = item.mode === 'approval' && !item.decision;
  const evidenceId = `ev-${item.id}`;

  return (
    <li className={cn('rounded-2xl border bg-surface p-4', waiting ? 'border-veld-200' : 'border-line')}>
      <div className="flex items-start gap-3">
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', TONE[item.kind])}>
          <Icon aria-hidden className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[0.9375rem] font-semibold text-ink">{item.title}</p>
            {!waiting && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-veld-700">
                <CircleCheck aria-hidden className="size-3.5" />
                {item.decision === 'approved' ? 'Approved' : 'Done automatically'}
              </span>
            )}
          </div>
          {!compact && <p className="mt-1 text-sm text-body">{item.detail}</p>}

          <div id={evidenceId} hidden={!open} className="mt-3 rounded-xl bg-paper p-3">
            <p className="text-xs font-semibold text-ink">What I based this on</p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted">
              {item.evidence.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {waiting && item.approveLabel && (
              <Button size="sm" onClick={() => onApprove(item)}>
                {item.approveLabel}
              </Button>
            )}
            {item.link && (
              <Link
                to={item.link.to}
                className={cn(
                  'inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold',
                  waiting && !item.approveLabel ? 'bg-veld-600 text-white hover:bg-veld-700' : 'border border-line-strong text-ink hover:border-ink-300',
                )}
              >
                {item.link.label}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={evidenceId}
              className="inline-flex h-9 items-center gap-1 rounded-full px-2 text-sm font-semibold text-veld-700 hover:text-veld-800"
            >
              Why?
              <ChevronDown aria-hidden className={cn('size-4 transition-transform', open && 'rotate-180')} />
            </button>
            <button type="button" onClick={() => onDismiss(item)} className="ml-auto h-9 rounded-full px-2 text-sm text-muted hover:text-ink">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export function AgentPanel({
  pending,
  done,
  onApprove,
  onDismiss,
  limit = 5,
}: {
  pending: AgentItem[];
  done: AgentItem[];
  onApprove: (i: AgentItem) => void;
  onDismiss: (i: AgentItem) => void;
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const doneShown = showAll ? done : done.slice(0, Math.max(2, limit - pending.length));
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="agent-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="agent-heading" className="flex items-center gap-2 text-lg font-semibold">
            <RouteMark className="size-5 text-veld-600" />
            Your assistant
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Works in the background on your data. It acts on small things and asks before sharing anything or committing you.
          </p>
        </div>
        <Link to="/app/forecast" className="text-sm font-semibold text-veld-700 hover:underline underline-offset-4">
          See forecasts
        </Link>
      </div>

      {pending.length > 0 && (
        <>
          <h3 className="mt-5 font-sans text-sm font-semibold text-ink">Needs your OK ({pending.length})</h3>
          <ul className="mt-2 space-y-3">
            {pending.map((i) => (
              <AgentCard key={i.id} item={i} onApprove={onApprove} onDismiss={onDismiss} />
            ))}
          </ul>
        </>
      )}
      {done.length > 0 && (
        <>
          <h3 className="mt-5 font-sans text-sm font-semibold text-ink">What I did for you</h3>
          <ul className="mt-2 space-y-3">
            {doneShown.map((i) => (
              <AgentCard key={i.id} item={i} onApprove={onApprove} onDismiss={onDismiss} />
            ))}
          </ul>
          {done.length > doneShown.length && (
            <button type="button" onClick={() => setShowAll(true)} className="mt-2 text-sm font-semibold text-veld-700 hover:underline">
              Show {done.length - doneShown.length} more
            </button>
          )}
        </>
      )}
      {pending.length === 0 && done.length === 0 && <p className="mt-4 text-sm text-muted">Nothing needs attention. I’ll keep watching your deadlines, funding and matches.</p>}
    </section>
  );
}
