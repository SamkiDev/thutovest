import { Link } from 'react-router-dom';
import type { EngineResult, StudentState } from '../../types';
import { PathwayLine } from '../engine/PathwayLine';
import { ProgressRing } from '../ui/Progress';
import { STAGES } from '../../data/journey';
import { EDUCATION_STAGES } from '../../data/labels';
import { greeting } from '../../utils/dates';
import { formatZAR, percent } from '../../utils/format';
import { fieldLabel } from '../../utils/matching';

/** Answers "Where am I in my study journey?" at a glance. */
export function JourneyHero({ state, engine }: { state: StudentState; engine: EngineResult }) {
  const stage = STAGES.find((s) => s.id === engine.currentStage)!;
  const urgent = engine.alerts.filter((a) => a.severity === 'urgent').length;
  const nextDeadline = engine.deadlines[0];
  const stageLabel = EDUCATION_STAGES.find((s) => s.value === state.profile.educationStage)?.label;

  return (
    <section aria-labelledby="journey-heading" className="relative overflow-hidden rounded-[1.5rem] bg-ink text-white">
      {/* contour texture: a quiet nod to a route map */}
      <svg aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-[18rem] w-[28rem] opacity-[0.07]" viewBox="0 0 400 260" fill="none">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M0 ${220 - i * 26}C120 ${200 - i * 26} 160 ${80 - i * 18} 400 ${60 - i * 14}`} stroke="white" strokeWidth="1.5" />
        ))}
      </svg>

      <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_auto] lg:gap-10 lg:p-8">
        <div>
          <p className="text-sm text-white/65">
            {stageLabel}, planning {fieldLabel(state.profile.field)}
          </p>
          <h1 id="journey-heading" className="mt-1 text-[1.875rem] leading-[1.1] font-bold text-white sm:text-[2.5rem]">
            {greeting()}, {state.profile.firstName}
          </h1>
          <p className="mt-3 max-w-xl text-[0.9375rem] text-white/80">
            <strong className="font-semibold text-white">{stage.title}</strong>.{' '}
            {urgent > 0 ? `${urgent} urgent ${urgent === 1 ? 'item' : 'items'} this week.` : 'Nothing urgent right now.'}
          </p>
        </div>

        <div className="flex items-center gap-4 lg:flex-col lg:items-end lg:gap-2">
          <ProgressRing value={engine.progress.ratio} size={92} stroke={9} dark label={`Journey ${percent(engine.progress.ratio)} complete`}>
            <span className="num font-display text-2xl font-bold">{percent(engine.progress.ratio)}</span>
          </ProgressRing>
          <p className="num text-sm text-white/70 lg:text-right">
            {engine.progress.completed} of {engine.progress.total} steps done
            {engine.progress.inProgress > 0 && <span className="block text-white/50">{engine.progress.inProgress} in progress</span>}
          </p>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-3 pt-5 pb-4 sm:px-8">
        <PathwayLine stageProgress={engine.stageProgress} currentStage={engine.currentStage} variant="dark" />
      </div>

      <dl className="relative grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 text-center sm:text-left">
        <Stat label="Open alerts" value={String(engine.alerts.length)} to="/app/radar" />
        <Stat label="Est. funding gap" value={formatZAR(engine.funding.gap)} to="/app/funding" />
        <Stat
          label="Next deadline"
          value={nextDeadline?.daysLeft != null ? `${nextDeadline.daysLeft} days` : 'None'}
          to="/app/journey"
        />
      </dl>
    </section>
  );
}

function Stat({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link to={to} className="block px-3 py-4 hover:bg-white/5 sm:px-8">
      <dt className="text-[0.6875rem] text-white/55 sm:text-xs">{label}</dt>
      <dd className="num mt-0.5 font-display text-base font-semibold text-white sm:text-xl">{value}</dd>
    </Link>
  );
}
