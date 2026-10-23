import { Link } from 'react-router-dom';
import { CalendarClock, CircleCheck, PartyPopper, Play } from 'lucide-react';
import { RouteMark } from '../layout/Logo';
import type { NextAction, TaskStatus } from '../../types';
import { Button, ButtonLink } from '../ui/Button';
import { SeverityBadge } from '../ui/Badge';
import { formatDate, relativeDays } from '../../utils/dates';
import { cn } from '../../utils/cn';

/** Answers "What should I do next?" */
export function NextBestAction({
  action,
  status,
  onSetStatus,
}: {
  action: NextAction | null;
  status?: TaskStatus;
  onSetStatus: (taskId: string, status: TaskStatus) => void;
}) {
  if (!action) {
    return (
      <section className="card flex h-full flex-col items-start justify-center p-6" aria-labelledby="nba-heading">
        <PartyPopper aria-hidden className="size-8 text-veld-600" />
        <h2 id="nba-heading" className="mt-3 text-2xl font-bold">
          Every step is done
        </h2>
        <p className="mt-1 text-muted">Plans changed? Update your profile.</p>
        <ButtonLink to="/app/profile" variant="secondary" className="mt-4">
          Review profile
        </ButtonLink>
      </section>
    );
  }

  const urgent = action.severity === 'urgent';
  return (
    <section
      aria-labelledby="nba-heading"
      className={cn('card relative flex h-full flex-col overflow-hidden p-5 sm:p-6', urgent && 'border-clay-100')}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="nba-heading" className="flex items-center gap-2 font-sans text-sm font-semibold text-veld-700">
          <RouteMark className="size-4" />
          Your next best action
        </h2>
        {action.severity && <SeverityBadge severity={action.severity} />}
      </div>

      <p className="mt-4 font-display text-[1.5rem] leading-tight font-bold text-ink sm:text-[1.75rem]">{action.title}</p>
      <p className="mt-2 text-[0.9375rem] text-body">{action.reason}</p>

      {action.dueDate && action.daysLeft != null && (
        <p className={cn('mt-4 inline-flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold', urgent ? 'bg-clay-50 text-clay-700' : 'bg-amber-50 text-amber-800')}>
          <CalendarClock aria-hidden className="size-4" />
          {formatDate(action.dueDate)}, {relativeDays(action.daysLeft).toLowerCase()}
          <span className="font-normal opacity-75">(demo date)</span>
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
        {action.taskId && (
          <Button icon={<CircleCheck aria-hidden className="size-4" />} onClick={() => onSetStatus(action.taskId!, 'completed')}>
            Mark as done
          </Button>
        )}
        {action.taskId && status === 'pending' && (
          <Button variant="secondary" icon={<Play aria-hidden className="size-4" />} onClick={() => onSetStatus(action.taskId!, 'in-progress')}>
            Start
          </Button>
        )}
        <Link to={action.route} className="inline-flex h-11 items-center px-2 text-[0.9375rem] font-semibold text-veld-700 hover:text-veld-800 hover:underline underline-offset-4">
          {action.routeLabel}
        </Link>
      </div>
    </section>
  );
}
