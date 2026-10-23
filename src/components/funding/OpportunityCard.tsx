import { useId } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import type { FundingOpportunity, Institution, OpportunityMatch, OpportunityStatus } from '../../types';
import { Badge, DemoTag } from '../ui/Badge';
import { MoneyInput } from '../forms/Fields';
import { OPPORTUNITY_STATUS } from '../../data/labels';
import { cn } from '../../utils/cn';

const MATCH_TONE = { possible: 'veld', check: 'amber', unlikely: 'outline' } as const;

export function OpportunityCard({
  op,
  match,
  status,
  awarded,
  onStatus,
  onAwarded,
  institutions = [],
}: {
  institutions?: Institution[];
  op: FundingOpportunity;
  match: OpportunityMatch;
  status: OpportunityStatus;
  awarded: number;
  onStatus: (s: OpportunityStatus) => void;
  onAwarded: (n: number) => void;
}) {
  const selectId = useId();
  const awardId = useId();
  return (
    <article className={cn('card flex h-full flex-col p-5', match.level === 'unlikely' && 'bg-surface/70')} aria-labelledby={`op-${op.id}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={MATCH_TONE[match.level]}>{match.label}</Badge>
        <Badge tone="neutral">{op.type}</Badge>
        {op.isDemoRecord && <DemoTag>Fictional demo record</DemoTag>}
      </div>
      <h3 id={`op-${op.id}`} className="mt-3 text-lg font-semibold">
        {op.name}
      </h3>
      <p className="text-sm text-muted">{op.provider}</p>
      <p className="mt-3 text-sm text-body">{op.summary}</p>

      <div className="mt-3 rounded-xl bg-paper p-3 text-sm">
        <p className="font-semibold text-ink">Basic eligibility</p>
        <p className="mt-0.5 text-body">{op.eligibilitySummary}</p>
        <ul className="mt-2 space-y-0.5 text-xs text-muted">
          {match.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </div>

      {op.id === 'institution-aid' && institutions.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {institutions.map((i) => (
            <li key={i.id}>
              <a href={i.funding.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-veld-700 hover:underline">
                {i.shortName}: {i.funding.label}
                <ExternalLink aria-hidden className="size-3.5" />
                <span className="sr-only">(official site, opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid flex-1 content-end gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={selectId} className="mb-1 block text-xs font-semibold text-ink">
            Your application status
          </label>
          <select
            id={selectId}
            value={status}
            onChange={(e) => onStatus(e.target.value as OpportunityStatus)}
            className={cn(
              'h-10 w-full rounded-xl border bg-surface px-3 text-sm font-medium focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none',
              status === 'awarded' ? 'border-veld-500 text-veld-700' : 'border-line-strong text-ink',
            )}
          >
            {OPPORTUNITY_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {status === 'awarded' && (
          <div>
            <label htmlFor={awardId} className="mb-1 block text-xs font-semibold text-ink">
              Amount awarded per year
            </label>
            <MoneyInput id={awardId} value={awarded} onChange={onAwarded} size="sm" />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Info aria-hidden className="size-3.5" /> Confirm eligibility and availability with the provider.
        </span>
        {op.officialUrl ? (
          <a href={op.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-veld-700 hover:underline">
            Official website
            <ExternalLink aria-hidden className="size-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <span className="text-xs">{op.isDemoRecord ? 'No link: not a real programme' : op.id === 'institution-aid' ? 'Links to your institutions are above' : 'Check with the provider'}</span>
        )}
      </div>
    </article>
  );
}
