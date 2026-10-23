import { useMemo, useState } from 'react';
import { ChevronDown, RotateCcw, ShieldCheck } from 'lucide-react';
import type { RiskAlert, Severity } from '../types';
import { useStudent } from '../hooks/useStudent';
import { useTaskActions } from '../hooks/useTaskActions';
import { useAllAlerts } from '../hooks/useDocuments';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AlertCard } from '../components/risk-radar/AlertCard';
import { PageHeader, EmptyState } from '../components/ui/Misc';
import { SEVERITY_LABEL } from '../data/labels';
import { cn } from '../utils/cn';

type Filter = 'all' | Severity;

const RULES = [
  { title: 'Deadlines', text: 'Any open application, funding or registration step due within 21 days. 7 days or less is “Act now”.' },
  { title: 'Documents', text: 'Any required document not marked done, with urgency set by when it is needed.' },
  { title: 'Funding gap', text: 'Estimated costs higher than identified funding. Half or more uncovered with no application submitted is “Act now”.' },
  { title: 'Registration', text: 'Registration steps still open once you have accepted an offer or are enrolled.' },
];

export default function RiskRadarPage() {
  const { engine } = useStudent();
  const allAlerts = useAllAlerts();
  const { setStatus } = useTaskActions();
  const [filter, setFilter] = useState<Filter>('all');
  const [rulesOpen, setRulesOpen] = useState(false);
  useDocumentTitle('Risk Radar');

  const counts = useMemo(
    () => ({
      all: allAlerts.length,
      urgent: allAlerts.filter((a) => a.severity === 'urgent').length,
      soon: allAlerts.filter((a) => a.severity === 'soon').length,
      watch: allAlerts.filter((a) => a.severity === 'watch').length,
    }),
    [allAlerts],
  );
  const shown = filter === 'all' ? allAlerts : allAlerts.filter((a) => a.severity === filter);

  // Tasks the radar would flag if they were reopened — shows what has been cleared.
  const cleared = engine.tasks.filter((t) => t.status === 'completed' && (t.kind === 'document' || (t.daysLeft != null && t.daysLeft <= 21)));

  const resolve = (a: RiskAlert) => a.taskId && setStatus(a.taskId, 'completed');

  const tabs: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'urgent', label: SEVERITY_LABEL.urgent },
    { id: 'soon', label: SEVERITY_LABEL.soon },
    { id: 'watch', label: SEVERITY_LABEL.watch },
  ];

  return (
    <div>
      <PageHeader
        title="Student Risk Radar"
        description="Each alert says why it fired and how to clear it."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile tone="clay" count={counts.urgent} label="Act now" detail="Due within 7 days or a large unfunded gap" />
        <SummaryTile tone="amber" count={counts.soon} label="Coming up" detail="Due within 3 weeks or partly funded" />
        <SummaryTile tone="neutral" count={counts.watch} label="To watch" detail="Not urgent yet" />
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-surface">
        <button
          type="button"
          onClick={() => setRulesOpen((o) => !o)}
          aria-expanded={rulesOpen}
          aria-controls="radar-rules"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-ink sm:px-5"
        >
          How flags work
          <ChevronDown aria-hidden className={cn('size-4 transition-transform', rulesOpen && 'rotate-180')} />
        </button>
        <div id="radar-rules" hidden={!rulesOpen} className="grid gap-4 border-t border-line px-4 py-4 sm:grid-cols-2 sm:px-5">
          {RULES.map((r) => (
            <div key={r.title}>
              <p className="text-sm font-semibold text-ink">{r.title}</p>
              <p className="mt-0.5 text-sm text-muted">{r.text}</p>
            </div>
          ))}
          <p className="text-xs text-subtle sm:col-span-2">
            The radar re-checks every time you change a task, your profile or your funding plan. It does not predict whether you will drop out.
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Filter alerts by urgency" className="mt-6 flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={filter === t.id}
            onClick={() => setFilter(t.id)}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors',
              filter === t.id ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-body hover:border-ink-300',
            )}
          >
            {t.label}
            <span className={cn('num rounded-full px-1.5 text-xs', filter === t.id ? 'bg-white/20' : 'bg-sunken')}>{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3" role="tabpanel" aria-label={`${tabs.find((t) => t.id === filter)?.label} alerts`}>
        {shown.length === 0 ? (
          <EmptyState icon={<ShieldCheck aria-hidden className="size-5" />} title={filter === 'all' ? 'Your radar is clear' : 'Nothing in this group'}>
            {filter === 'all'
              ? 'No deadlines, documents or funding issues are flagged. Keep your profile up to date so the radar stays accurate.'
              : 'Try another filter to see the rest of your alerts.'}
          </EmptyState>
        ) : (
          shown.map((a) => <AlertCard key={a.id} alert={a} onResolve={resolve} />)
        )}
      </div>

      {cleared.length > 0 && (
        <section className="mt-10" aria-labelledby="cleared-heading">
          <h2 id="cleared-heading" className="text-lg font-semibold">
            Cleared from your radar
          </h2>
          <p className="mt-0.5 text-sm text-muted">Completed steps that would be flagged if they were still open.</p>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
            {cleared.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <ShieldCheck aria-hidden className="size-5 shrink-0 text-veld-600" />
                <span className="min-w-0 flex-1 text-sm text-body line-through decoration-ink-300">{t.title}</span>
                <button
                  type="button"
                  onClick={() => setStatus(t.id, 'pending')}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted hover:bg-sunken hover:text-ink"
                >
                  <RotateCcw aria-hidden className="size-3.5" /> Reopen
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SummaryTile({ tone, count, label, detail }: { tone: 'clay' | 'amber' | 'neutral'; count: number; label: string; detail: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        tone === 'clay' && 'border-clay-100 bg-clay-50',
        tone === 'amber' && 'border-amber-100 bg-amber-50',
        tone === 'neutral' && 'border-line bg-surface',
      )}
    >
      <p className={cn('num font-display text-3xl font-bold', tone === 'clay' ? 'text-clay-700' : tone === 'amber' ? 'text-amber-800' : 'text-ink')}>{count}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{label}</p>
      <p className="text-xs text-muted">{detail}</p>
    </div>
  );
}
