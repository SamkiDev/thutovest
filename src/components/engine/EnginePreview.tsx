import { useMemo, useState } from 'react';
import { CircleCheck, RotateCcw } from 'lucide-react';
import { RouteMark } from '../layout/Logo';
import { createDemoState } from '../../utils/createState';
import { computeEngine } from '../../utils/engine';
import { studentReducer } from '../../state/studentReducer';
import { PathwayLine } from './PathwayLine';
import { AlertCard } from '../risk-radar/AlertCard';
import { GapBar } from '../funding/GapBar';
import { SeverityBadge } from '../ui/Badge';
import { formatZAR, percent } from '../../utils/format';
import { relativeDays } from '../../utils/dates';

/**
 * A live, self-contained Student Success Engine running on Tatenda's demo
 * data. Visitors can complete the next action and watch everything update —
 * the landing page shows the product rather than describing it.
 */
export function EnginePreview() {
  const [state, setState] = useState(createDemoState);
  const [steps, setSteps] = useState(0);
  const engine = useMemo(() => computeEngine(state), [state]);
  const next = engine.nextAction;

  const complete = () => {
    if (!next?.taskId) return;
    const after = studentReducer(state, { type: 'setTaskStatus', taskId: next.taskId, status: 'completed' });
    if (after) {
      setState(after);
      setSteps((s) => s + 1);
    }
  };

  const reset = () => {
    setState(createDemoState());
    setSteps(0);
  };

  return (
    <div className="relative" aria-label="Interactive preview of the Student Success Engine" role="region">
      <div className="card overflow-hidden shadow-lift">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-veld-100 font-display font-bold text-veld-800">T</span>
            <div>
              <p className="text-sm font-semibold text-ink">Tatenda’s pathway</p>
              <p className="text-xs text-muted">Grade 12, Computing & IT, demo student</p>
            </div>
          </div>
          <p className="num text-right font-display text-xl font-bold text-ink" aria-live="polite">
            {percent(engine.progress.ratio)}
            <span className="block font-sans text-[0.6875rem] font-medium text-muted">journey done</span>
          </p>
        </div>

        <div className="px-3 pt-4 pb-3 sm:px-5">
          <PathwayLine stageProgress={engine.stageProgress} currentStage={engine.currentStage} showCounts={false} />
        </div>

        <div className="mx-3 rounded-2xl bg-ink p-4 text-white sm:mx-5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-veld-300">
              <RouteMark className="size-3.5" /> Next best action
            </p>
            {next?.severity && <SeverityBadge severity={next.severity} />}
          </div>
          <p className="mt-2 font-display text-lg leading-snug font-semibold" aria-live="polite">
            {next ? next.title : 'Every step is done'}
          </p>
          {next?.daysLeft != null && <p className="mt-0.5 text-sm text-white/65">{relativeDays(next.daysLeft)}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {next?.taskId && (
              <button
                type="button"
                onClick={complete}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-veld-300 px-4 text-sm font-semibold text-ink hover:bg-veld-200"
              >
                <CircleCheck aria-hidden className="size-4" /> Try it: mark as done
              </button>
            )}
            {steps > 0 && (
              <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-white/75 hover:text-white">
                <RotateCcw aria-hidden className="size-3.5" /> Reset preview
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-0 sm:grid-cols-[1.25fr_1fr]">
          <div className="px-4 pt-3 sm:px-5 sm:pb-4">
            <p className="text-xs font-semibold text-muted">
              Risk Radar <span className="num font-normal">({engine.alerts.length} open)</span>
            </p>
            <ul className="divide-y divide-line">
              {engine.alerts.slice(0, 3).map((a) => (
                <AlertCard key={a.id} alert={a} compact />
              ))}
            </ul>
          </div>
          <div className="border-t border-line px-4 py-4 sm:border-t-0 sm:border-l sm:px-5">
            <p className="text-xs font-semibold text-muted">Estimated funding gap</p>
            <p className="num mt-1 font-display text-2xl font-bold text-ink">{formatZAR(engine.funding.gap)}</p>
            <GapBar funding={engine.funding} className="mt-3" />
            <p className="mt-2 text-xs text-muted">
              {formatZAR(engine.funding.identifiedFunding)} of {formatZAR(engine.funding.totalCost)} identified
            </p>
          </div>
        </div>
      </div>
      {steps > 0 && (
        <p className="rise mt-3 text-center text-sm text-muted" role="status">
          Progress, alerts and the next action recalculated from {steps} {steps === 1 ? 'change' : 'changes'}.
        </p>
      )}
    </div>
  );
}
