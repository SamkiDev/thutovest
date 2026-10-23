import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BellRing, CalendarClock, Clock, HandCoins, Wallet } from 'lucide-react';
import { useStudent } from '../hooks/useStudent';
import { useAgent } from '../hooks/useAgent';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePlatform } from '../platform/PlatformProvider';
import { PageHeader } from '../components/ui/Misc';
import { AgentPanel } from '../components/agent/AgentCard';
import { activityRhythm, forecastCashFlow, forecastPace, fundingScenarios } from '../intelligence/forecast';
import { formatZAR, formatZARCompact, pluralise } from '../utils/format';
import { formatDate } from '../utils/dates';
import { cn } from '../utils/cn';

const timeFmt = new Intl.DateTimeFormat('en-ZA', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

export default function ForecastPage() {
  const { state, engine } = useStudent();
  const { platform } = usePlatform();
  const { brief, approve, dismiss } = useAgent();
  const location = useLocation();
  useDocumentTitle('Forecast');

  const pace = useMemo(() => forecastPace(state, engine.tasks), [state, engine.tasks]);
  const rhythm = useMemo(() => activityRhythm(state.taskHistory ?? [], state.activity), [state.taskHistory, state.activity]);
  const cash = useMemo(() => forecastCashFlow(state), [state]);
  const pendingOffers = platform.applications
    .filter((a) => a.studentId === state.id && a.status === 'offered')
    .map((a) => ({ label: `${platform.funds.find((f) => f.id === a.fundId)?.name ?? 'Sponsor offer'} (offer)`, amount: a.amount ?? 0 }));
  const scenarios = fundingScenarios(state, pendingOffers);

  useEffect(() => {
    if (location.hash === '#cash') requestAnimationFrame(() => document.getElementById('cash')?.scrollIntoView({ block: 'start' }));
  }, [location.hash]);

  return (
    <div>
      <PageHeader
        title="Forecast"
        description="Predictions from your own patterns: how fast you work, when you’re active, and when money moves. Each one shows the data behind it."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        {/* Deadline outlook */}
        <section className="card p-5 sm:p-6 lg:col-span-2" aria-labelledby="pace-heading">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h2 id="pace-heading" className="flex items-center gap-2 text-lg font-semibold">
                <CalendarClock aria-hidden className="size-5 text-veld-600" /> Deadline outlook
              </h2>
              <p className="mt-2 font-display text-2xl leading-tight font-bold text-ink sm:text-[1.75rem]">
                {pace.projections.length === 0
                  ? 'No open deadlines to forecast.'
                  : pace.lateCount === 0
                    ? `At your pace you’ll meet all ${pace.projections.length} deadlines.`
                    : `At your pace, ${pace.lateCount} of ${pace.projections.length} deadlines are likely to be missed.`}
              </p>
              {pace.lateCount > 0 && (
                <p className="mt-2 text-sm text-body">
                  To meet every deadline, aim for about <strong>{pace.requiredPerWeek} tasks a week</strong> until {formatDate(pace.projections[0].task.dueDate!)}.
                </p>
              )}
            </div>
            <dl className="grid grid-cols-3 gap-3 text-center sm:gap-5">
              <Stat label="Your pace" value={`${pace.perWeek}/wk`} />
              <Stat label="Needed" value={`${pace.requiredPerWeek}/wk`} tone={pace.requiredPerWeek > pace.perWeek ? 'warn' : 'ok'} />
              <Stat label="Done early by" value={pace.leadDays != null ? `${pace.leadDays} d` : 'n/a'} />
            </dl>
          </div>

          {pace.projections.length > 0 && <PaceTimeline projections={pace.projections} />}
          <p className="mt-4 text-xs text-muted">
            Based on{' '}
            {pace.basis === 'history'
              ? `${pace.completions} tasks you finished in the last ${pace.windowDays} days`
              : `an assumed ${pace.perWeek} tasks a week until you have more history`}
            . Tasks are worked through in deadline order; steps already in progress count as half done.
          </p>
        </section>

        {/* Rhythm */}
        <section className="card p-5 sm:p-6" aria-labelledby="rhythm-heading">
          <h2 id="rhythm-heading" className="flex items-center gap-2 text-lg font-semibold">
            <Clock aria-hidden className="size-5 text-veld-600" /> When you work
          </h2>
          <p className="mt-2 text-body">
            You’re most active on <strong>{rhythm.peakLabel}</strong> ({rhythm.peakRange}).
          </p>
          <HourChart counts={rhythm.hourCounts} />
          {rhythm.nextNudge && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-paper p-3 text-sm text-body">
              <BellRing aria-hidden className="size-4 shrink-0 text-veld-600" />
              Next reminder: {timeFmt.format(rhythm.nextNudge)}
            </p>
          )}
          <p className="mt-3 text-xs text-muted">From {rhythm.sample} timestamps of tasks and actions in your plan.</p>
        </section>

        {/* Funding scenarios */}
        <section className="card p-5 sm:p-6" aria-labelledby="scen-heading">
          <h2 id="scen-heading" className="flex items-center gap-2 text-lg font-semibold">
            <HandCoins aria-hidden className="size-5 text-veld-600" /> Funding scenarios
          </h2>
          <div className="mt-4 space-y-4">
            <Scenario label="Secured today" gap={scenarios.gapToday} total={scenarios.total} funded={scenarios.secured} />
            <Scenario label="If everything pending succeeds" gap={scenarios.gapIfPendingSucceeds} total={scenarios.total} funded={scenarios.secured + scenarios.pending} />
          </div>
          {scenarios.pendingItems.length > 0 ? (
            <ul className="mt-4 space-y-1 text-sm text-body">
              {scenarios.pendingItems.map((p) => (
                <li key={p.label} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate">{p.label}</span>
                  <span className="num font-semibold">{formatZAR(p.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Nothing is pending yet. Submit a funding application or share your profile with a sponsor to see a second scenario.</p>
          )}
          <p className="mt-3 text-xs text-muted">Pending external applications use a planning estimate of the costs they usually cover. Only the provider decides the real amount.</p>
        </section>

        {/* Cash flow */}
        <section id="cash" tabIndex={-1} className="card scroll-mt-20 p-5 outline-none sm:p-6 lg:col-span-2" aria-labelledby="cash-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <h2 id="cash-heading" className="flex items-center gap-2 text-lg font-semibold">
                <Wallet aria-hidden className="size-5 text-veld-600" /> Cash flow, {cash.year}
              </h2>
              <p className="mt-2 font-display text-2xl leading-tight font-bold text-ink">
                {cash.firstShortMonth
                  ? `You’re predicted to run short in ${cash.firstShortMonth.month}, by about ${formatZAR(Math.round(-cash.firstShortMonth.balance / 100) * 100)}.`
                  : 'Your money lasts the whole year on current estimates.'}
              </p>
              <p className="mt-1 text-sm text-body">Running balance month by month, if your current plan and funding stay the same.</p>
            </div>
          </div>
          <CashChart months={cash.months} />
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-semibold text-veld-700">Show the numbers and assumptions</summary>
            <div className="relative mt-3 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <caption className="sr-only">Monthly cash-flow forecast</caption>
                <thead>
                  <tr className="text-xs text-muted">
                    <th scope="col" className="py-1.5 pr-3 font-semibold">Month</th>
                    <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Money in</th>
                    <th scope="col" className="py-1.5 pr-3 text-right font-semibold">Money out</th>
                    <th scope="col" className="py-1.5 text-right font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody className="num divide-y divide-line">
                  {cash.months.map((m) => (
                    <tr key={m.month}>
                      <th scope="row" className="py-1.5 pr-3 font-medium text-ink">{m.month}</th>
                      <td className="py-1.5 pr-3 text-right">{formatZAR(m.inflow)}</td>
                      <td className="py-1.5 pr-3 text-right">{formatZAR(m.outflow)}</td>
                      <td className={cn('py-1.5 text-right font-semibold', m.balance < 0 ? 'text-clay-700' : 'text-ink')}>{formatZAR(m.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-muted">
              {cash.assumptions.map((a) => (
                <li key={a}>• {a}</li>
              ))}
            </ul>
          </details>
        </section>

        <div className="lg:col-span-2">
          <AgentPanel pending={brief.pending} done={brief.done} onApprove={approve} onDismiss={dismiss} limit={6} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn('num font-display text-xl font-bold', tone === 'warn' ? 'text-clay-700' : 'text-ink')}>{value}</dd>
    </div>
  );
}

function PaceTimeline({ projections }: { projections: ReturnType<typeof forecastPace>['projections'] }) {
  const max = Math.max(...projections.map((p) => Math.max(p.task.daysLeft!, p.task.daysLeft! + p.daysLate)), 7);
  const pct = (d: number) => `${(Math.max(0, d) / max) * 100}%`;
  return (
    <figure className="mt-5">
      <ul className="space-y-3">
        {projections.slice(0, 7).map((p) => {
          const projectedDays = p.task.daysLeft! + p.daysLate;
          const late = p.daysLate > 0;
          return (
            <li key={p.task.id} className="grid grid-cols-1 gap-1 sm:grid-cols-[14rem_1fr] sm:items-center sm:gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{p.task.title}</p>
                <p className={cn('text-xs', late ? 'font-semibold text-clay-700' : 'text-muted')}>
                  {late ? `${pluralise(p.daysLate, 'day')} late` : `${pluralise(-p.daysLate, 'day')} to spare`}
                </p>
              </div>
              <div className="relative h-6" role="img" aria-label={`Due in ${p.task.daysLeft} days, projected done in ${projectedDays} days`}>
                <div className="absolute inset-y-[9px] left-0 right-0 rounded-full bg-sunken" />
                <div
                  className={cn('absolute inset-y-[9px] left-0 rounded-full', late ? 'bg-clay-500' : 'bg-veld-500')}
                  style={{ width: pct(projectedDays) }}
                />
                <div className="absolute inset-y-0 w-[2px] bg-ink" style={{ left: pct(p.task.daysLeft!) }} />
                <span className="absolute -top-0.5 text-[0.625rem] font-semibold text-ink" style={{ left: `calc(${pct(p.task.daysLeft!)} + 4px)` }}>
                  due
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-veld-500" />Projected finish, on time</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-clay-500" />Projected finish, late</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-[2px] bg-ink" />Due date</span>
        <span>Scale: today to {max} days ahead</span>
      </figcaption>
    </figure>
  );
}

function HourChart({ counts }: { counts: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...counts, 1);
  return (
    <figure className="mt-4">
      <div className="relative flex h-24 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {counts.map((c, h) => (
          <button
            key={h}
            type="button"
            onMouseEnter={() => setHover(h)}
            onFocus={() => setHover(h)}
            onBlur={() => setHover(null)}
            aria-label={`${String(h).padStart(2, '0')}:00, ${c} actions`}
            className="group flex h-full flex-1 items-end"
          >
            <span
              className={cn('w-full rounded-t-[4px]', c === 0 ? 'bg-sunken' : hover === h ? 'bg-veld-700' : 'bg-veld-500')}
              style={{ height: c === 0 ? 2 : `${(c / max) * 100}%` }}
            />
          </button>
        ))}
        {hover != null && (
          <span
            className="pointer-events-none absolute -top-7 rounded-md bg-ink px-2 py-0.5 text-xs whitespace-nowrap text-white"
            style={{ left: `clamp(0px, calc(${(hover / 24) * 100}% - 2rem), calc(100% - 6rem))` }}
          >
            {String(hover).padStart(2, '0')}:00, {counts[hover]} actions
          </span>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[0.6875rem] text-muted" aria-hidden>
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </figure>
  );
}

function CashChart({ months }: { months: ReturnType<typeof forecastCashFlow>['months'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxAbs = Math.max(...months.map((m) => Math.abs(m.balance)), 1);
  const posMax = Math.max(0, ...months.map((m) => m.balance));
  const negMax = Math.max(0, ...months.map((m) => -m.balance));
  const zeroAt = (posMax / (posMax + negMax || 1)) * 100;
  return (
    <figure className="mt-5">
      <div className="relative h-56" onMouseLeave={() => setHover(null)}>
        <div className="absolute right-0 left-0 border-t border-ink-300" style={{ top: `${zeroAt}%` }} aria-hidden />
        <span className="absolute -left-0.5 -translate-y-full pb-0.5 text-[0.6875rem] text-muted" style={{ top: `${zeroAt}%` }} aria-hidden>
          R0
        </span>
        <div className="absolute inset-0 grid grid-cols-12 gap-[3px] sm:gap-2">
          {months.map((m, i) => {
            const h = (Math.abs(m.balance) / (posMax + negMax || maxAbs)) * 100;
            const neg = m.balance < 0;
            return (
              <button
                key={m.month}
                type="button"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${m.month}: balance ${formatZAR(m.balance)}`}
                className="relative h-full"
              >
                <span
                  className={cn(
                    'absolute right-0 left-0',
                    neg ? 'rounded-b-[4px]' : 'rounded-t-[4px]',
                    neg ? (hover === i ? 'bg-clay-700' : 'bg-clay-500') : hover === i ? 'bg-veld-700' : 'bg-veld-500',
                  )}
                  style={neg ? { top: `${zeroAt}%`, height: `${Math.max(h, 0.6)}%` } : { bottom: `${100 - zeroAt}%`, height: `${Math.max(h, 0.6)}%` }}
                />
              </button>
            );
          })}
        </div>
        {hover != null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-44 rounded-lg bg-ink p-3 text-xs text-white shadow-lg"
            style={{ left: `clamp(0px, calc(${((hover + 0.5) / 12) * 100}% - 5.5rem), calc(100% - 11rem))` }}
          >
            <p className="font-semibold">{months[hover].month}</p>
            <p className="num mt-1 flex justify-between"><span className="text-white/70">In</span>{formatZAR(months[hover].inflow)}</p>
            <p className="num flex justify-between"><span className="text-white/70">Out</span>{formatZAR(months[hover].outflow)}</p>
            <p className="num flex justify-between font-semibold"><span className="text-white/70">Balance</span>{formatZAR(months[hover].balance)}</p>
            {months[hover].notes.length > 0 && <p className="mt-1 text-white/70">{months[hover].notes.join(', ')}</p>}
          </div>
        )}
      </div>
      <div className="mt-1.5 grid grid-cols-12 gap-[3px] text-center text-[0.6875rem] text-muted sm:gap-2" aria-hidden>
        {months.map((m) => (
          <span key={m.month}>{m.month}</span>
        ))}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-veld-500" />Money left over</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-clay-500" />Shortfall</span>
        <span>Lowest point {formatZARCompact(Math.min(...months.map((m) => m.balance)))}. Hover a month for detail.</span>
      </figcaption>
    </figure>
  );
}

function Scenario({ label, gap, total, funded }: { label: string; gap: number; total: number; funded: number }) {
  const ratio = total > 0 ? Math.min(1, funded / total) : 1;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">{label}</span>
        <span className="num text-muted">
          gap <strong className={cn(gap > 0 ? 'text-ink' : 'text-veld-700')}>{formatZAR(gap)}</strong>
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-sunken" role="img" aria-label={`${label}: ${Math.round(ratio * 100)}% funded, gap ${formatZAR(gap)}`}>
        <div className="h-full rounded-full bg-veld-500 transition-[width] duration-500" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

