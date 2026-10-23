import { Check } from 'lucide-react';
import type { StageId } from '../../types';
import { STAGES } from '../../data/journey';
import { cn } from '../../utils/cn';

interface Props {
  stageProgress: Record<StageId, { completed: number; total: number }>;
  currentStage: StageId;
  variant?: 'dark' | 'light';
  showCounts?: boolean;
  className?: string;
}

/**
 * The signature ThutoVest element: the student journey drawn as a route,
 * with each stage a station. Filled up to where the student actually is.
 */
export function PathwayLine({ stageProgress, currentStage, variant = 'light', showCounts = true, className }: Props) {
  const n = STAGES.length;
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
  const cur = stageProgress[currentStage];
  const within = cur && cur.total > 0 ? cur.completed / cur.total : 0;
  const fill = Math.min(1, (currentIndex + within) / (n - 1));
  const dark = variant === 'dark';

  return (
    <ol aria-label="Journey stages" className={cn('relative grid', className)} style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {/* track */}
      <span
        aria-hidden
        className={cn('absolute top-[13px] h-[3px] rounded-full', dark ? 'bg-white/15' : 'bg-line')}
        style={{ left: `${50 / n}%`, right: `${50 / n}%` }}
      />
      <span
        aria-hidden
        className={cn('absolute top-[13px] h-[3px] rounded-full transition-[width] duration-700 ease-out', dark ? 'bg-veld-300' : 'bg-veld-500')}
        style={{ left: `${50 / n}%`, width: `calc(${fill} * (100% - ${100 / n}%))` }}
      />
      {STAGES.map((stage, i) => {
        const p = stageProgress[stage.id];
        const done = i < currentIndex || (p.total > 0 && p.completed === p.total);
        const current = stage.id === currentStage && !done;
        const stateText = done ? 'complete' : current ? 'current stage' : 'upcoming';
        return (
          <li key={stage.id} className="relative flex flex-col items-center text-center" aria-current={current ? 'step' : undefined}>
            <span className="relative grid size-[29px] place-items-center">
              {current && <span aria-hidden className={cn('pulse-ring absolute inset-0 rounded-full', dark ? 'bg-veld-300/50' : 'bg-veld-400/40')} />}
              <span
                aria-hidden
                className={cn(
                  'relative grid size-[29px] place-items-center rounded-full border-[3px] transition-colors',
                  done && (dark ? 'border-veld-300 bg-veld-300 text-ink' : 'border-veld-600 bg-veld-600 text-white'),
                  current && (dark ? 'border-veld-300 bg-ink' : 'border-veld-500 bg-surface'),
                  !done && !current && (dark ? 'border-white/25 bg-ink' : 'border-line-strong bg-surface'),
                )}
              >
                {done && <Check className="size-3.5" strokeWidth={3.5} />}
                {current && <span className={cn('size-2.5 rounded-full', dark ? 'bg-veld-300' : 'bg-veld-500')} />}
              </span>
            </span>
            <span
              className={cn(
                'mt-2 max-w-full truncate px-0.5 text-[0.6875rem] font-semibold sm:text-xs',
                dark ? (current ? 'text-white' : 'text-white/65') : current ? 'text-ink' : 'text-muted',
              )}
            >
              {stage.short}
              <span className="sr-only">, {stateText}</span>
            </span>
            {showCounts && p.total > 0 && (
              <span className={cn('num mt-0.5 hidden text-[0.6875rem] sm:block', dark ? 'text-white/60' : 'text-subtle')}>
                {p.completed}/{p.total}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
