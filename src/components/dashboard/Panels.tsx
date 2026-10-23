import { useNavigate, Link } from 'react-router-dom';
import { Activity, CalendarDays, CircleCheck, ClipboardList, Compass, HandCoins, MessagesSquare, ShieldCheck, UserRound } from 'lucide-react';
import type { ActivityItem, EngineResult, JourneyTask, RiskAlert } from '../../types';
import { AlertCard } from '../risk-radar/AlertCard';
import { GapBar } from '../funding/GapBar';
import { ProgressBar } from '../ui/Progress';
import { DemoTag } from '../ui/Badge';
import { EmptyState } from '../ui/Misc';
import { STAGES } from '../../data/journey';
import { formatDayMonth, relativeDays, timeAgo } from '../../utils/dates';
import { formatZAR, percent } from '../../utils/format';
import { cn } from '../../utils/cn';

function PanelHeader({ id, title, link, linkLabel }: { id: string; title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {link && (
        <Link to={link} className="text-sm font-semibold text-veld-700 hover:text-veld-800 hover:underline underline-offset-4">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/** Answers "What could prevent me from progressing?" */
export function RiskSummary({ alerts }: { alerts: RiskAlert[] }) {
  const counts = {
    urgent: alerts.filter((a) => a.severity === 'urgent').length,
    soon: alerts.filter((a) => a.severity === 'soon').length,
    watch: alerts.filter((a) => a.severity === 'watch').length,
  };
  return (
    <section className="card h-full p-5 sm:p-6" aria-labelledby="risk-heading">
      <PanelHeader id="risk-heading" title="Student Risk Radar" link="/app/radar" linkLabel="See all alerts" />
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-clay-50 px-3 py-1 text-clay-700">{counts.urgent} act now</span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{counts.soon} coming up</span>
        <span className="rounded-full bg-sunken px-3 py-1 text-body">{counts.watch} to watch</span>
      </div>
      {alerts.length === 0 ? (
        <EmptyState className="mt-4" icon={<ShieldCheck aria-hidden className="size-5" />} title="No risks flagged">
          The engine checks deadlines, documents and your funding gap every time something changes.
        </EmptyState>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {alerts.slice(0, 4).map((a) => (
            <AlertCard key={a.id} alert={a} compact />
          ))}
        </ul>
      )}
      {alerts.length > 4 && <p className="mt-1 text-sm text-muted">+{alerts.length - 4} more on the Risk Radar</p>}
    </section>
  );
}

export function FundingSnapshot({ engine, needsFunding }: { engine: EngineResult; needsFunding: boolean }) {
  const f = engine.funding;
  return (
    <section className="card flex h-full flex-col p-5 sm:p-6" aria-labelledby="funding-heading">
      <PanelHeader id="funding-heading" title="Funding gap" link="/app/funding" linkLabel="Open solver" />
      <p className="mt-4 text-sm text-muted">Estimated amount still to find for next year</p>
      <p className={cn('num mt-1 font-display text-[2.5rem] leading-none font-bold', f.gap > 0 ? 'text-ink' : 'text-veld-700')}>
        {formatZAR(f.gap)}
      </p>
      <GapBar funding={f} className="mt-5" />
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">Estimated costs</dt>
          <dd className="num font-semibold text-ink">{formatZAR(f.totalCost)}</dd>
        </div>
        <div>
          <dt className="text-muted">Funding identified</dt>
          <dd className="num font-semibold text-veld-700">
            {formatZAR(f.identifiedFunding)} <span className="font-normal text-muted">({percent(f.coveredRatio)})</span>
          </dd>
        </div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-2 pt-5">
        <DemoTag>Your estimates</DemoTag>
        {needsFunding && f.gap > 0 && (
          <Link to="/app/funding#opportunities" className="inline-flex items-center gap-1.5 text-sm font-semibold text-veld-700 hover:underline underline-offset-4">
            <HandCoins aria-hidden className="size-4" />
            View possible matches
          </Link>
        )}
      </div>
    </section>
  );
}

export function DeadlinesCard({ deadlines }: { deadlines: JourneyTask[] }) {
  return (
    <section className="card h-full p-5 sm:p-6" aria-labelledby="deadline-heading">
      <PanelHeader id="deadline-heading" title="Upcoming deadlines" link="/app/journey" linkLabel="Journey" />
      {deadlines.length === 0 ? (
        <EmptyState className="mt-4" icon={<CalendarDays aria-hidden className="size-5" />} title="No open deadlines">
          Dated steps you still need to finish will appear here.
        </EmptyState>
      ) : (
        <ul className="mt-4 space-y-3">
          {deadlines.slice(0, 4).map((t) => {
            const { day, month } = formatDayMonth(t.dueDate!);
            const tone = t.daysLeft! <= 7 ? 'clay' : t.daysLeft! <= 21 ? 'amber' : 'neutral';
            return (
              <li key={t.id} className="flex items-center gap-3">
                <span
                  className={cn(
                    'grid w-12 shrink-0 place-items-center rounded-xl py-1.5 leading-none',
                    tone === 'clay' && 'bg-clay-50 text-clay-700',
                    tone === 'amber' && 'bg-amber-50 text-amber-800',
                    tone === 'neutral' && 'bg-sunken text-body',
                  )}
                >
                  <span className="num font-display text-lg font-bold">{day}</span>
                  <span className="text-[0.6875rem] font-semibold">{month}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{t.title}</p>
                  <p className="text-xs text-muted">{relativeDays(t.daysLeft!)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-subtle">Deadlines are demo dates counted from when this pathway was created.</p>
    </section>
  );
}

export function TaskOverview({ engine }: { engine: EngineResult }) {
  return (
    <section className="card h-full p-5 sm:p-6" aria-labelledby="tasks-heading">
      <PanelHeader id="tasks-heading" title="Tasks by stage" link="/app/journey" linkLabel="Open" />
      <ul className="mt-4 space-y-4">
        {STAGES.map((s) => {
          const p = engine.stageProgress[s.id];
          if (p.total === 0) return null;
          const done = p.completed === p.total;
          return (
            <li key={s.id}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className={cn('flex items-center gap-1.5 font-medium', done ? 'text-veld-700' : 'text-ink')}>
                  {done && <CircleCheck aria-hidden className="size-4" />}
                  {s.title}
                </span>
                <span className="num text-xs text-muted">
                  {p.completed}/{p.total}
                </span>
              </div>
              <ProgressBar value={p.completed / p.total} label={`${s.title}: ${p.completed} of ${p.total} done`} size="sm" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const ACTIVITY_ICON: Record<ActivityItem['kind'], typeof Activity> = {
  task: ClipboardList,
  profile: UserRound,
  funding: HandCoins,
  explore: Compass,
  alert: ShieldCheck,
  system: Activity,
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="card h-full p-5 sm:p-6" aria-labelledby="activity-heading">
      <PanelHeader id="activity-heading" title="Recent activity" />
      <ol className="mt-4 space-y-4">
        {items.slice(0, 5).map((a) => {
          const Icon = ACTIVITY_ICON[a.kind];
          return (
            <li key={a.id} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sunken text-muted">
                <Icon aria-hidden className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-body">{a.text}</p>
                <p className="text-xs text-subtle">{timeAgo(a.at)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function NavigatorPrompt() {
  const navigate = useNavigate();
  const questions = ['What should I do next?', 'How do I close my funding gap?', 'Which documents do I still need?'];
  return (
    <section className="flex h-full flex-col rounded-[var(--radius-card)] bg-veld-700 p-5 text-white sm:p-6" aria-labelledby="nav-heading">
      <h2 id="nav-heading" className="flex items-center gap-2 text-lg font-semibold text-white">
        <MessagesSquare aria-hidden className="size-5 text-veld-200" />
        Ask the Student Navigator
      </h2>
      <p className="mt-1 text-sm text-white/80">Plain-language answers that use your own pathway data.</p>
      <div className="mt-4 flex flex-col items-start gap-2">
        {questions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => navigate(`/app/navigator?q=${encodeURIComponent(q)}`)}
            className="rounded-full bg-white/10 px-4 py-2 text-left text-sm font-medium hover:bg-white/20"
          >
            {q}
          </button>
        ))}
      </div>
      <Link to="/app/navigator" className="mt-auto pt-5 text-sm font-semibold text-white underline-offset-4 hover:underline">
        Open the Navigator
      </Link>
    </section>
  );
}
