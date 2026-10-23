import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CircleCheck, ChevronDown, FileExclamationPoint, HandCoins, ClipboardList, Hourglass } from 'lucide-react';
import type { AlertCategory, RiskAlert, Severity } from '../../types';
import { SeverityBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDate, relativeDays } from '../../utils/dates';
import { cn } from '../../utils/cn';

export const CATEGORY_ICON: Record<AlertCategory, typeof CalendarClock> = {
  deadline: CalendarClock,
  document: FileExclamationPoint,
  funding: HandCoins,
  registration: ClipboardList,
};

const RAIL: Record<Severity, string> = {
  urgent: 'bg-clay-500',
  soon: 'bg-amber-400',
  watch: 'bg-ink-200',
};

const ICON_TONE: Record<Severity, string> = {
  urgent: 'bg-clay-50 text-clay-600',
  soon: 'bg-amber-50 text-amber-700',
  watch: 'bg-sunken text-muted',
};

export function AlertCard({
  alert,
  onResolve,
  compact = false,
  defaultOpen = false,
}: {
  alert: RiskAlert;
  onResolve?: (alert: RiskAlert) => void;
  compact?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = CATEGORY_ICON[alert.category];
  const detailsId = `alert-${alert.id}-details`;

  if (compact) {
    return (
      <li className="flex items-start gap-3 py-3">
        <span className={cn('mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl', ICON_TONE[alert.severity])}>
          <Icon aria-hidden className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-ink">{alert.title}</p>
            <SeverityBadge severity={alert.severity} />
          </div>
          <p className="mt-0.5 truncate text-sm text-muted">{alert.subject}</p>
        </div>
        {alert.daysLeft != null && (
          <span className={cn('num shrink-0 pt-0.5 text-xs font-semibold', alert.severity === 'urgent' ? 'text-clay-600' : 'text-muted')}>
            {alert.daysLeft}d
            <span className="sr-only"> left</span>
          </span>
        )}
      </li>
    );
  }

  return (
    <article className="card relative overflow-hidden" aria-labelledby={`alert-${alert.id}-title`}>
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', RAIL[alert.severity])} />
      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex items-start gap-4">
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', ICON_TONE[alert.severity])}>
            <Icon aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={alert.severity} />
              {alert.dueDate && alert.daysLeft != null && (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Hourglass aria-hidden className="size-3.5" />
                  Due {formatDate(alert.dueDate)}, {relativeDays(alert.daysLeft).toLowerCase()}
                </span>
              )}
            </div>
            <h3 id={`alert-${alert.id}-title`} className="mt-2 text-base font-semibold sm:text-lg">
              {alert.title}
            </h3>
            <p className="mt-0.5 font-medium text-body">{alert.subject}</p>
            <p className="mt-2 text-sm text-muted">{alert.impact}</p>
          </div>
        </div>

        <div id={detailsId} hidden={!open} className="mt-4 grid gap-3 rounded-xl bg-paper p-4 text-sm sm:ml-[3.375rem]">
          <div>
            <p className="font-semibold text-ink">Why this was flagged</p>
            <p className="mt-0.5 text-body">{alert.why}</p>
          </div>
          <div>
            <p className="font-semibold text-ink">Recommended action</p>
            <p className="mt-0.5 text-body">{alert.recommendedAction}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 sm:ml-[3.375rem]">
          {alert.taskId && onResolve && (
            <Button size="sm" icon={<CircleCheck aria-hidden className="size-4" />} onClick={() => onResolve(alert)}>
              Mark as done
            </Button>
          )}
          <Link
            to={alert.route}
            className="inline-flex h-9 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:border-ink-300"
          >
            {alert.routeLabel}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={detailsId}
            className="ml-auto inline-flex h-9 items-center gap-1 rounded-full px-2 text-sm font-semibold text-veld-700 hover:text-veld-800"
          >
            {open ? 'Hide' : 'Why?'}
            <ChevronDown aria-hidden className={cn('size-4 transition-transform', open && 'rotate-180')} />
          </button>
        </div>
      </div>
    </article>
  );
}
