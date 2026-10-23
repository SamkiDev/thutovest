import { useId } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import type { JourneyTask, TaskStatus } from '../../types';
import { PriorityDot } from '../ui/Badge';
import { TASK_STATUS_LABEL } from '../../data/labels';
import { formatDate, relativeDays } from '../../utils/dates';
import { cn } from '../../utils/cn';

const STATUSES: TaskStatus[] = ['pending', 'in-progress', 'completed'];

export function TaskStatusControl({ task, onChange }: { task: JourneyTask; onChange: (s: TaskStatus) => void }) {
  const name = useId();
  return (
    <fieldset className="shrink-0">
      <legend className="sr-only">Status for {task.title}</legend>
      <div className="inline-flex rounded-full border border-line-strong bg-paper p-0.5">
        {STATUSES.map((s) => {
          const active = task.status === s;
          return (
            <label
              key={s}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-veld-300',
                active && s === 'completed' && 'bg-veld-600 text-white',
                active && s === 'in-progress' && 'bg-ink text-white',
                active && s === 'pending' && 'bg-surface text-ink shadow-sm',
                !active && 'text-muted hover:text-ink',
              )}
            >
              <input type="radio" name={name} value={s} checked={active} onChange={() => onChange(s)} className="sr-only" />
              {TASK_STATUS_LABEL[s]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TaskRow({ task, onStatus }: { task: JourneyTask; onStatus: (s: TaskStatus) => void }) {
  const done = task.status === 'completed';
  const dueTone =
    task.daysLeft == null || done ? 'neutral' : task.daysLeft <= 7 ? 'clay' : task.daysLeft <= 21 ? 'amber' : 'neutral';
  return (
    <li className={cn('rounded-2xl border bg-surface p-4 transition-colors sm:p-5', done ? 'border-line' : 'border-line-strong/70')}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h4 className={cn('font-sans text-[0.9375rem] font-semibold', done ? 'text-muted line-through decoration-ink-300' : 'text-ink')}>{task.title}</h4>
          <p className="mt-1 text-sm text-muted">{task.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <PriorityDot priority={task.priority} />
            {task.dueDate && task.daysLeft != null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  dueTone === 'clay' && 'text-clay-600',
                  dueTone === 'amber' && 'text-amber-700',
                  dueTone === 'neutral' && 'text-muted',
                )}
              >
                <CalendarClock aria-hidden className="size-3.5" />
                {formatDate(task.dueDate)}
                {!done && `, ${relativeDays(task.daysLeft).toLowerCase()}`}
              </span>
            )}
            {!done && (
              <Link to={task.action.to} className="text-xs font-semibold text-veld-700 hover:underline underline-offset-4">
                {task.action.label}
              </Link>
            )}
          </div>
        </div>
        <TaskStatusControl task={task} onChange={onStatus} />
      </div>
    </li>
  );
}
