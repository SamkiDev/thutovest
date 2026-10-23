import { useEffect, useRef, useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Misc';
import { cn } from '../../utils/cn';

export interface CheckStep {
  label: string;
  /** Step that fails when the demo failure toggle is on. */
  failLabel?: string;
}

/**
 * Plays a verification check step by step. In the prototype every check is
 * simulated; the step list mirrors what an accredited provider would do.
 */
export function CheckRunner({
  open,
  title,
  description,
  steps,
  onClose,
  onResult,
  allowFailureDemo = true,
}: {
  open: boolean;
  title: string;
  description: string;
  steps: CheckStep[];
  onClose: () => void;
  onResult: (ok: boolean, failedStep?: string) => void;
  allowFailureDemo?: boolean;
}) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [index, setIndex] = useState(0);
  const [fail, setFail] = useState(false);
  const [ok, setOk] = useState(true);
  const timers = useRef<number[]>([]);
  const failAt = steps.findIndex((s) => s.failLabel);

  useEffect(() => {
    if (!open) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPhase('ready');
      setIndex(0);
      setFail(false);
    }
  }, [open]);

  const run = () => {
    setPhase('running');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = reduce ? 150 : 650;
    const stopAt = fail && failAt >= 0 ? failAt : steps.length;
    for (let i = 1; i <= Math.min(stopAt + 1, steps.length); i++) {
      timers.current.push(
        window.setTimeout(() => {
          if (i > stopAt) {
            setOk(false);
            setIndex(stopAt);
            setPhase('done');
            onResult(false, steps[stopAt].failLabel);
            return;
          }
          setIndex(i);
          if (i === steps.length) {
            setOk(true);
            setPhase('done');
            onResult(true);
          }
        }, tick * i),
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        phase === 'ready' ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={run}>Start check</Button>
          </>
        ) : (
          <Button onClick={onClose} disabled={phase === 'running'}>
            {phase === 'running' ? 'Checking…' : 'Done'}
          </Button>
        )
      }
    >
      <ol className="space-y-3" aria-live="polite">
        {steps.map((s, i) => {
          const failedHere = phase === 'done' && !ok && i === index;
          const passed = i < index || (phase === 'done' && ok);
          const active = phase === 'running' && i === index;
          return (
            <li key={s.label} className={cn('flex items-center gap-3 text-sm', !passed && !active && !failedHere && 'text-muted')}>
              {failedHere ? (
                <CircleX aria-hidden className="size-5 shrink-0 text-clay-600" />
              ) : passed ? (
                <CircleCheck aria-hidden className="size-5 shrink-0 text-veld-600" />
              ) : active ? (
                <Spinner className="size-5 text-veld-600" label={s.label} />
              ) : (
                <span aria-hidden className="size-5 shrink-0 rounded-full border-2 border-line-strong" />
              )}
              <span className={cn(passed && 'text-ink', failedHere && 'font-semibold text-clay-700')}>{failedHere ? s.failLabel : s.label}</span>
            </li>
          );
        })}
      </ol>
      {phase === 'done' && (
        <p className={cn('rise mt-5 rounded-xl p-3 text-sm', ok ? 'bg-veld-50 text-veld-800' : 'bg-clay-50 text-clay-700')} role="status">
          {ok ? 'Check passed. Your verification level has been updated.' : 'Check failed. Nothing was shared. You can try again with a clearer photo, or ask for a manual review.'}
        </p>
      )}
      {phase === 'ready' && allowFailureDemo && failAt >= 0 && (
        <label className="mt-5 flex items-start gap-2 rounded-xl border border-dashed border-ink-300 p-3 text-xs text-muted">
          <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-clay-500)]" />
          <span>
            <strong className="text-ink">Demo:</strong> simulate a failed check, to see how the app stops a fraudulent attempt.
          </span>
        </label>
      )}
      <p className="mt-4 text-xs text-subtle">Prototype: this check is simulated. No photos or ID numbers are collected or stored.</p>
    </Modal>
  );
}
