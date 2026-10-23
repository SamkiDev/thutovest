import type { CostBreakdown, FundingSummary } from '../../types';
import { COST_LABELS } from '../../data/labels';
import { COST_KEYS } from '../../utils/funding';
import { formatZAR, percent } from '../../utils/format';
import { cn } from '../../utils/cn';

const COST_SHADES = ['#0d1b3e', '#2e4478', '#5a6f9e', '#8c9bc0', '#c3cce0'];

const hatch = {
  backgroundImage:
    'repeating-linear-gradient(135deg, var(--color-amber-100) 0 6px, var(--color-amber-50) 6px 12px)',
};

/** Simple covered-vs-gap bar used on the dashboard and landing preview. */
export function GapBar({ funding, dark = false, className }: { funding: FundingSummary; dark?: boolean; className?: string }) {
  const covered = funding.coveredRatio;
  return (
    <div className={className}>
      <div
        className={cn('flex h-3.5 w-full overflow-hidden rounded-full', dark ? 'bg-white/10' : 'bg-sunken')}
        role="img"
        aria-label={`${percent(covered)} of estimated costs covered. Estimated gap ${formatZAR(funding.gap)}.`}
      >
        <div className={cn('h-full transition-[width] duration-700 ease-out', dark ? 'bg-veld-300' : 'bg-veld-500')} style={{ width: `${covered * 100}%` }} />
        {funding.gap > 0 && <div className="h-full flex-1 border-l-2 border-white" style={hatch} />}
      </div>
    </div>
  );
}

/** Detailed two-row comparison for the Funding Gap Solver. */
export function CostFundingChart({ costs, funding }: { costs: CostBreakdown; funding: FundingSummary }) {
  const scale = Math.max(funding.totalCost, funding.identifiedFunding, 1);
  const width = (v: number) => `${(v / scale) * 100}%`;

  return (
    <figure>
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-ink">Estimated costs</span>
            <span className="num font-semibold text-ink">{formatZAR(funding.totalCost)}</span>
          </div>
          <div className="flex h-7 w-full overflow-hidden rounded-lg bg-sunken" aria-hidden>
            {COST_KEYS.map((k, i) =>
              costs[k] > 0 ? (
                <div
                  key={k}
                  className="h-full border-r-2 border-white transition-[width] duration-500 ease-out last:border-r-0"
                  style={{ width: width(costs[k]), background: COST_SHADES[i] }}
                  title={`${COST_LABELS[k].label}: ${formatZAR(costs[k])}`}
                />
              ) : null,
            )}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-ink">Identified funding</span>
            <span className="num font-semibold text-veld-700">{formatZAR(funding.identifiedFunding)}</span>
          </div>
          <div className="flex h-7 w-full overflow-hidden rounded-lg bg-sunken" aria-hidden>
            <div className="h-full bg-veld-500 transition-[width] duration-500 ease-out" style={{ width: width(funding.identifiedFunding) }} />
            {funding.gap > 0 && (
              <div className="flex h-full items-center justify-center border-l-2 border-white text-[0.6875rem] font-bold text-amber-800" style={{ width: width(funding.gap), ...hatch }}>
                <span className="truncate px-1">Gap</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted" aria-hidden>
        {COST_KEYS.map((k, i) => (
          <li key={k} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: COST_SHADES[i] }} />
            {COST_LABELS[k].label.split(' ')[0]}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-veld-500" />
          Funding
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm border border-amber-400" style={hatch} />
          Estimated gap
        </li>
      </ul>
      <figcaption className="sr-only">
        Estimated costs total {formatZAR(funding.totalCost)}:{' '}
        {COST_KEYS.map((k) => `${COST_LABELS[k].label} ${formatZAR(costs[k])}`).join(', ')}. Identified funding is{' '}
        {formatZAR(funding.identifiedFunding)}, covering {percent(funding.coveredRatio)}. The estimated gap is {formatZAR(funding.gap)}.
      </figcaption>
    </figure>
  );
}
