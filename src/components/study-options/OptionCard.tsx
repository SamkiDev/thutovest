import { Bookmark, BookmarkCheck, CircleAlert, Check, GitCompareArrows, MapPin, Clock } from 'lucide-react';
import type { StudyMatch } from '../../types';
import { Badge, DemoTag } from '../ui/Badge';
import { FIT_LABEL } from '../../utils/matching';
import { formatZAR } from '../../utils/format';
import { MODE_LABEL } from '../../data/labels';
import { cn } from '../../utils/cn';

const FIT_TONE = { strong: 'veld', good: 'ink', partial: 'outline' } as const;

export function OptionCard({
  match,
  saved,
  comparing,
  compareDisabled,
  onToggleSave,
  onToggleCompare,
  onView,
  compact = false,
}: {
  match: StudyMatch;
  saved: boolean;
  comparing?: boolean;
  compareDisabled?: boolean;
  onToggleSave: () => void;
  onToggleCompare?: () => void;
  onView: () => void;
  compact?: boolean;
}) {
  const { option, institution, fit, reasons, cautions } = match;
  const shownReasons = compact ? reasons.slice(0, 2) : reasons.slice(0, 3);

  return (
    <article className="card flex h-full flex-col p-4 sm:p-5" aria-labelledby={`opt-${option.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={FIT_TONE[fit]}>{FIT_LABEL[fit]}</Badge>
          <Badge tone="neutral">{option.type}</Badge>
        </div>
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${option.qualification} from shortlist` : `Save ${option.qualification} to shortlist`}
          className={cn(
            '-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-full transition-colors',
            saved ? 'bg-veld-50 text-veld-600 hover:bg-veld-100' : 'text-muted hover:bg-sunken hover:text-ink',
          )}
        >
          {saved ? <BookmarkCheck aria-hidden className="size-5" /> : <Bookmark aria-hidden className="size-5" />}
        </button>
      </div>

      <h3 id={`opt-${option.id}`} className="mt-3 text-[1.0625rem] leading-snug font-semibold">
        <button type="button" onClick={onView} className="text-left hover:text-veld-700">
          {option.qualification}
        </button>
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
        <MapPin aria-hidden className="size-3.5 shrink-0" />
        {institution.name}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-paper p-3 text-xs">
        <div>
          <dt className="text-muted">Tuition / yr</dt>
          <dd className="num mt-0.5 text-sm font-semibold text-ink">{formatZAR(option.indicativeTuition)}</dd>
        </div>
        <div>
          <dt className="text-muted">Duration</dt>
          <dd className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-ink">
            <Clock aria-hidden className="size-3.5 text-muted" />
            {option.durationYears} {option.durationYears === 1 ? 'yr' : 'yrs'}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Mode</dt>
          <dd className="mt-0.5 text-sm font-semibold text-ink">{option.modes.map((m) => MODE_LABEL[m]).join(', ')}</dd>
        </div>
      </dl>

      <div className="mt-4 flex-1">
        <p className="text-xs font-semibold text-ink">Why it matches you</p>
        <ul className="mt-1.5 space-y-1">
          {shownReasons.map((r) => (
            <li key={r} className="flex gap-1.5 text-sm text-body">
              <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-veld-600" strokeWidth={3} />
              {r}
            </li>
          ))}
          {!compact &&
            cautions.slice(0, 1).map((c) => (
              <li key={c} className="flex gap-1.5 text-sm text-amber-800">
                <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                {c}
              </li>
            ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
        <button type="button" onClick={onView} className="h-9 rounded-full px-1 text-sm font-semibold text-veld-700 hover:text-veld-800 hover:underline underline-offset-4">
          View details
        </button>
        {onToggleCompare && (
          <button
            type="button"
            onClick={onToggleCompare}
            disabled={compareDisabled && !comparing}
            aria-pressed={comparing}
            className={cn(
              'ml-auto inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors disabled:opacity-40',
              comparing ? 'border-ink bg-ink text-white' : 'border-line-strong text-ink hover:border-ink-300',
            )}
          >
            <GitCompareArrows aria-hidden className="size-4" />
            {comparing ? 'Comparing' : 'Compare'}
          </button>
        )}
        {!onToggleCompare && <DemoTag className="ml-auto">Indicative fees</DemoTag>}
      </div>
    </article>
  );
}
