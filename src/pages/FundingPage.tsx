import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lightbulb, Plus, RotateCcw, Trash, Award } from 'lucide-react';
import type { CostKey, FundingSourceKind } from '../types';
import { useStudent } from '../hooks/useStudent';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { DemoTag } from '../components/ui/Badge';
import { Why } from '../components/ui/Why';
import { MoneyInput } from '../components/forms/Fields';
import { CostFundingChart } from '../components/funding/GapBar';
import { OpportunityCard } from '../components/funding/OpportunityCard';
import { COST_LABELS, SOURCE_KIND_LABEL } from '../data/labels';
import { FUNDING_OPPORTUNITIES } from '../data/fundingOpportunities';
import { COST_KEYS, gapIdeas, matchOpportunity, preferredInstitutions } from '../utils/funding';
import { formatZAR, percent } from '../utils/format';
import { BUDGET_SOURCE_ID } from '../utils/createState';
import { cn } from '../utils/cn';

const LEVEL_ORDER = { possible: 0, check: 1, unlikely: 2 };

export default function FundingPage() {
  const { state, engine, dispatch } = useStudent();
  const notify = useToast();
  const location = useLocation();
  useDocumentTitle('Funding Gap Solver');
  const f = engine.funding;

  useEffect(() => {
    if (location.hash === '#opportunities') {
      requestAnimationFrame(() => document.getElementById('opportunities')?.scrollIntoView({ block: 'start' }));
    }
  }, [location.hash]);

  const opportunities = useMemo(() => {
    const institutions = preferredInstitutions(state.profile);
    return FUNDING_OPPORTUNITIES.map((op) => ({ op, match: matchOpportunity(op, state.profile, institutions) })).sort(
      (a, b) => LEVEL_ORDER[a.match.level] - LEVEL_ORDER[b.match.level],
    );
  }, [state.profile]);
  const ideas = gapIdeas(state, f.gap);
  const awardedOps = FUNDING_OPPORTUNITIES.filter((o) => state.opportunityStatus[o.id] === 'awarded');

  return (
    <div>
      <PageHeader
        title="Funding Gap Solver"
        description="Next year’s costs against the funding you’ve found."
        kicker={<DemoTag>All amounts are your estimates</DemoTag>}
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
        {/* Summary — first on mobile so the answer is visible straight away */}
        <aside className="lg:sticky lg:top-6 lg:order-2 lg:col-span-5" aria-labelledby="summary-heading">
          <section className="card overflow-hidden">
            <div className="bg-ink p-5 text-white sm:p-6">
              <h2 id="summary-heading" className="font-sans text-sm font-semibold text-white/75">
                Estimated funding gap
              </h2>
              <p className="num mt-1 font-display text-[2.75rem] leading-none font-bold" aria-live="polite">
                {formatZAR(f.gap)}
              </p>
              <p className="mt-2 text-sm text-white/70">
                {f.gap > 0 ? `${percent(f.coveredRatio)} of your estimated costs are covered.` : 'Your identified funding covers your estimated costs.'}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <CostFundingChart costs={state.costs} funding={f} />
              {f.identifiedFunding > f.totalCost && (
                <p className="mt-4 rounded-xl bg-veld-50 p-3 text-sm text-veld-800">
                  You have an estimated {formatZAR(f.identifiedFunding - f.totalCost)} more than your cost estimate. Keep it as a buffer for surprises.
                </p>
              )}
            </div>
          </section>

          {ideas.length > 0 && (
            <section className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6" aria-labelledby="ideas-heading">
              <h2 id="ideas-heading" className="flex items-center gap-2 text-base font-semibold">
                <Lightbulb aria-hidden className="size-4 text-amber-500" />
                Ways to close the gap
              </h2>
              <ul className="mt-3 space-y-3">
                {ideas.map((i) => (
                  <li key={i.id}>
                    <Link to={i.to} className="group block rounded-xl p-2 -m-2 hover:bg-paper">
                      <span className="block text-sm font-semibold text-ink group-hover:text-veld-700">{i.title}</span>
                      <span className="block text-sm text-muted">{i.detail}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <div className="space-y-5 lg:order-1 lg:col-span-7">
          <section className="card p-5 sm:p-6" aria-labelledby="costs-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="costs-heading" className="text-lg font-semibold">
                  Estimated costs for one year
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {state.costsCustomised ? 'Edited by you.' : 'Pre-filled from your profile and indicative demo fees.'}
                </p>
              </div>
              {state.costsCustomised && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RotateCcw aria-hidden className="size-4" />}
                  onClick={() => {
                    dispatch({ type: 'resetCostsToEstimate' });
                    notify('Costs reset to your profile estimate.', 'info');
                  }}
                >
                  Reset to estimate
                </Button>
              )}
            </div>
            <div className="mt-5 divide-y divide-line">
              {COST_KEYS.map((k) => (
                <CostRow key={k} k={k} value={state.costs[k]} onChange={(v) => dispatch({ type: 'setCost', key: k, value: v })} />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between border-t-2 border-ink pt-3">
              <span className="font-semibold text-ink">Total estimated cost</span>
              <span className="num font-display text-xl font-bold text-ink">{formatZAR(f.totalCost)}</span>
            </div>
          </section>

          <section className="card p-5 sm:p-6" aria-labelledby="sources-heading">
            <h2 id="sources-heading" className="text-lg font-semibold">
              Funding you’ve identified
            </h2>
            <p className="mt-0.5 text-sm text-muted">Family contributions, savings, work and any confirmed awards.</p>

            <ul className="mt-4 space-y-3">
              {state.fundingSources.map((s) => (
                <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_9.5rem_auto]">
                  <div className="min-w-0 px-1">
                    <input
                      aria-label="Funding source name"
                      value={s.label}
                      onChange={(e) => dispatch({ type: 'updateSource', id: s.id, patch: { label: e.target.value } })}
                      className="w-full rounded-md bg-transparent text-sm font-semibold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-veld-200"
                    />
                    <p className="text-xs text-muted">
                      {SOURCE_KIND_LABEL[s.kind]}
                      {s.id === BUDGET_SOURCE_ID && ', linked to your profile budget'}
                    </p>
                  </div>
                  <MoneyInput
                    label={`${s.label} amount`}
                    value={s.amount}
                    onChange={(v) => dispatch({ type: 'updateSource', id: s.id, patch: { amount: v } })}
                    size="sm"
                    className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'removeSource', id: s.id });
                      notify(`Removed “${s.label}”.`, 'info');
                    }}
                    className="col-start-2 row-start-1 grid size-10 place-items-center rounded-full text-muted hover:bg-clay-50 hover:text-clay-600 sm:col-start-auto sm:row-start-auto"
                    aria-label={`Remove ${s.label}`}
                  >
                    <Trash aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
              {awardedOps.map((o) => (
                <li key={o.id} className="flex items-center gap-3 rounded-xl border border-veld-200 bg-veld-50/60 p-3">
                  <Award aria-hidden className="size-5 shrink-0 text-veld-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{o.name}</p>
                    <p className="text-xs text-muted">Marked as awarded below</p>
                  </div>
                  <span className="num font-semibold text-veld-700">{formatZAR(state.awardedAmounts[o.id] ?? 0)}</span>
                </li>
              ))}
              {state.fundingSources.length === 0 && awardedOps.length === 0 && (
                <li className="rounded-xl border border-dashed border-line-strong p-4 text-center text-sm text-muted">
                  No funding added yet. Add what your family can contribute, savings or part-time income.
                </li>
              )}
            </ul>

            <AddSourceForm
              onAdd={(label, kind, amount) => {
                dispatch({ type: 'addSource', source: { label, kind, amount } });
                notify(`Added “${label}”. Estimated gap is now ${formatZAR(Math.max(0, f.gap - amount))}.`);
              }}
            />
          </section>
        </div>
      </div>

      <section id="opportunities" tabIndex={-1} className="mt-12 scroll-mt-20 outline-none" aria-labelledby="opps-heading">
        <div className="mb-5 max-w-2xl">
          <h2 id="opps-heading" className="text-2xl font-bold">
            Possible funding opportunities
          </h2>
          <p className="mt-1 text-sm text-muted">A match isn’t an eligibility decision. Only the provider can confirm.</p>
          <Why className="mt-1" label="How these are ordered">
            Ordered by how well the published focus lines up with your field, income band and institutions. A possible match is not an eligibility decision. Only the provider can confirm that.
          </Why>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {opportunities.map(({ op, match }) => (
            <OpportunityCard
              key={op.id}
              op={op}
              match={match}
              status={state.opportunityStatus[op.id] ?? 'not-started'}
              awarded={state.awardedAmounts[op.id] ?? 0}
              onStatus={(s) => {
                dispatch({ type: 'setOpportunityStatus', id: op.id, status: s });
                notify(
                  s === 'awarded'
                    ? `Marked ${op.name} as awarded. Enter the amount to include it in your funding.`
                    : s === 'submitted'
                      ? `${op.name} marked as submitted. Your Risk Radar has been updated.`
                      : `${op.name} status updated.`,
                  s === 'awarded' || s === 'submitted' ? 'success' : 'info',
                );
              }}
              onAwarded={(n) => dispatch({ type: 'setAwardedAmount', id: op.id, amount: n })}
              institutions={preferredInstitutions(state.profile)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CostRow({ k, value, onChange }: { k: CostKey; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className="grid grid-cols-1 items-center gap-2 py-3 sm:grid-cols-[1fr_11rem] sm:gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {COST_LABELS[k].label}
        </label>
        <p id={`${id}-hint`} className="text-xs text-muted">
          {COST_LABELS[k].hint}
        </p>
      </div>
      <MoneyInput id={id} value={value} onChange={onChange} describedBy={`${id}-hint`} />
    </div>
  );
}

function AddSourceForm({ onAdd }: { onAdd: (label: string, kind: FundingSourceKind, amount: number) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<FundingSourceKind>('savings');
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ids = { label: useId(), kind: useId(), amount: useId() };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return setError('Give this funding source a name, for example “Uncle’s contribution”.');
    if (amount <= 0) return setError('Enter an amount greater than R0.');
    onAdd(label.trim(), kind, amount);
    setLabel('');
    setAmount(0);
    setError(null);
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="secondary" size="sm" className="mt-4" icon={<Plus aria-hidden className="size-4" />} onClick={() => setOpen(true)}>
        Add funding source
      </Button>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rise mt-4 rounded-xl border border-line bg-paper p-4">
      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <label htmlFor={ids.label} className="mb-1 block text-xs font-semibold text-ink">
            Name
          </label>
          <input
            id={ids.label}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Weekend job"
            aria-invalid={error && !label.trim() ? true : undefined}
            className={cn('h-10 w-full rounded-xl border bg-surface px-3 text-sm focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none', error && !label.trim() ? 'border-clay-500' : 'border-line-strong')}
          />
        </div>
        <div>
          <label htmlFor={ids.kind} className="mb-1 block text-xs font-semibold text-ink">
            Type
          </label>
          <select
            id={ids.kind}
            value={kind}
            onChange={(e) => setKind(e.target.value as FundingSourceKind)}
            className="h-10 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
          >
            {Object.entries(SOURCE_KIND_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={ids.amount} className="mb-1 block text-xs font-semibold text-ink">
            Amount per year
          </label>
          <MoneyInput id={ids.amount} value={amount} onChange={setAmount} size="sm" invalid={Boolean(error && amount <= 0)} />
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-clay-600">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm">
          Add source
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setError(null); }}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
