import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, EyeOff } from 'lucide-react';
import { useStudent } from '../hooks/useStudent';
import { useTaskActions } from '../hooks/useTaskActions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader, EmptyState } from '../components/ui/Misc';
import { PathwayLine } from '../components/engine/PathwayLine';
import { ProgressBar } from '../components/ui/Progress';
import { TaskRow } from '../components/journey/TaskRow';
import { STAGES } from '../data/journey';
import { institutionById } from '../data/institutions';
import { InstitutionLinks } from '../components/study-options/InstitutionLinks';
import { percent } from '../utils/format';
import { cn } from '../utils/cn';

type View = 'all' | 'open' | 'done';

export default function JourneyPage() {
  const { engine, state } = useStudent();
  const { setStatus } = useTaskActions();
  const [view, setView] = useState<View>('all');
  useDocumentTitle('Student Journey');

  const visible = engine.tasks.filter((t) => (view === 'all' ? true : view === 'open' ? t.status !== 'completed' : t.status === 'completed'));
  const currentIndex = STAGES.findIndex((s) => s.id === engine.currentStage);
  const preferredInsts = state.profile.preferredInstitutionIds.map(institutionById).filter((i): i is NonNullable<typeof i> => Boolean(i));

  return (
    <div>
      <PageHeader
        title="Adaptive Student Journey"
        description="Your plan is built from your profile. Change any step’s status and your dashboard, progress and Risk Radar update straight away."
      />

      <section className="card p-5 sm:p-6" aria-label="Journey progress">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="num font-display text-3xl font-bold text-ink">{percent(engine.progress.ratio)}</p>
            <p className="text-sm text-muted">
              {engine.progress.completed} of {engine.progress.total} steps done, {engine.progress.inProgress} in progress
            </p>
          </div>
          <div className="w-full sm:w-64">
            <ProgressBar value={engine.progress.ratio} label="Overall journey progress" />
          </div>
        </div>
        <PathwayLine stageProgress={engine.stageProgress} currentStage={engine.currentStage} />
      </section>

      <div role="radiogroup" aria-label="Show steps" className="mt-6 inline-flex rounded-full border border-line-strong bg-surface p-1">
        {(
          [
            ['all', 'All steps'],
            ['open', 'Still to do'],
            ['done', 'Done'],
          ] as [View, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={view === v}
            onClick={() => setView(v)}
            className={cn('h-9 rounded-full px-4 text-sm font-semibold transition-colors', view === v ? 'bg-ink text-white' : 'text-muted hover:text-ink')}
          >
            {label}
          </button>
        ))}
      </div>

      <ol className="relative mt-6">
        {STAGES.map((stage, i) => {
          const tasks = visible.filter((t) => t.stageId === stage.id);
          const p = engine.stageProgress[stage.id];
          if (p.total === 0) return null;
          const done = p.completed === p.total;
          const current = i === currentIndex && !done;
          const last = i === STAGES.length - 1;
          return (
            <li key={stage.id} className="relative pb-8 pl-11 sm:pl-14">
              {!last && (
                <span aria-hidden className={cn('absolute top-8 bottom-0 left-[13px] w-[3px] rounded-full sm:left-[17px]', i < currentIndex ? 'bg-veld-500' : 'bg-line')} />
              )}
              <span
                aria-hidden
                className={cn(
                  'absolute top-0.5 left-0 grid size-[29px] place-items-center rounded-full border-[3px] sm:left-1',
                  done && 'border-veld-600 bg-veld-600 text-white',
                  current && 'border-veld-500 bg-surface',
                  !done && !current && 'border-line-strong bg-surface',
                )}
              >
                {done && <Check className="size-3.5" strokeWidth={3.5} />}
                {current && <span className="size-2.5 rounded-full bg-veld-500" />}
              </span>
              <section aria-labelledby={`stage-${stage.id}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id={`stage-${stage.id}`} className="text-xl font-semibold">
                    {stage.title}
                    {current && <span className="ml-2 align-middle font-sans text-xs font-semibold text-veld-700">You are here</span>}
                  </h2>
                  <span className="num text-sm text-muted">
                    {p.completed}/{p.total} done
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted">{stage.description}</p>
                {stage.id === 'apply' && preferredInsts.length > 0 && (
                  <div className="mt-3 rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-semibold text-ink">Apply on the official sites</p>
                    <ul className="mt-2 space-y-3">
                      {preferredInsts.map((inst) => (
                        <li key={inst.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                          <span className="w-14 shrink-0 text-sm font-semibold text-ink">{inst.shortName}</span>
                          <InstitutionLinks inst={inst} compact />
                        </li>
                      ))}
                    </ul>
                    <Link to="/app/institutions" className="mt-2 inline-block text-xs font-semibold text-veld-700 hover:underline">
                      All universities and colleges
                    </Link>
                  </div>
                )}
                {tasks.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm text-muted">
                    {view === 'open' ? 'Everything in this stage is done.' : 'No completed steps in this stage yet.'}
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {tasks.map((t) => (
                      <TaskRow key={t.id} task={t} onStatus={(s) => setStatus(t.id, s)} />
                    ))}
                  </ul>
                )}
              </section>
            </li>
          );
        })}
      </ol>

      {engine.tasks.length === 0 && <EmptyState icon={<Check aria-hidden className="size-5" />} title="No steps yet">Complete your profile to build a journey.</EmptyState>}

      {engine.hiddenTasks.length > 0 && (
        <section className="mt-4 rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="hidden-heading">
          <h2 id="hidden-heading" className="flex items-center gap-2 text-base font-semibold">
            <EyeOff aria-hidden className="size-4 text-muted" />
            {engine.hiddenTasks.length} steps hidden for your profile
          </h2>
          <p className="mt-1 text-sm text-muted">
            These don’t apply to you right now.{' '}
            <Link to="/app/profile" className="font-semibold text-veld-700 hover:underline">
              Change your profile
            </Link>{' '}
            and they’ll return if they become relevant.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {engine.hiddenTasks.map(({ task, reason }) => (
              <li key={task.id} className="rounded-xl bg-paper px-4 py-3 text-sm">
                <span className="block font-medium text-ink">{task.title}</span>
                <span className="text-xs text-muted">{reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
