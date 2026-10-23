import { Check, CircleAlert } from 'lucide-react';
import { InstitutionLinks } from './InstitutionLinks';
import type { StudyMatch } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge, DemoTag } from '../ui/Badge';
import { FIT_LABEL, fieldLabel } from '../../utils/matching';
import { formatZAR } from '../../utils/format';
import { INSTITUTION_TYPE_LABEL, MODE_LABEL } from '../../data/labels';

export function OptionDetailModal({
  match,
  saved,
  isTuitionSource,
  onClose,
  onToggleSave,
  onUseForCosts,
}: {
  match: StudyMatch | null;
  saved: boolean;
  isTuitionSource: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onUseForCosts: () => void;
}) {
  if (!match) return null;
  const { option, institution } = match;
  const rows: [string, string][] = [
    ['Institution', `${institution.name} (${INSTITUTION_TYPE_LABEL[institution.type]})`],
    ['Location', institution.city],
    ['Field', fieldLabel(option.field)],
    ['Qualification type', `${option.type}, NQF level ${option.nqfLevel}`],
    ['Duration', `${option.durationYears} ${option.durationYears === 1 ? 'year' : 'years'}`],
    ['Study mode', option.modes.map((m) => MODE_LABEL[m]).join(', ')],
    ['Indicative tuition', `${formatZAR(option.indicativeTuition)} a year`],
    ['Sample APS guide', String(option.apsGuide)],
    ['Sample subject guide', option.subjects],
    ['Possible careers', option.careers.join(', ')],
  ];

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={option.qualification}
      description={option.summary}
      footer={
        <>
          <Button variant="secondary" onClick={onToggleSave}>
            {saved ? 'Remove from shortlist' : 'Save to shortlist'}
          </Button>
          <Button onClick={onUseForCosts} disabled={isTuitionSource}>
            {isTuitionSource ? 'Used in your cost plan' : 'Use for my cost estimate'}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={match.fit === 'strong' ? 'veld' : match.fit === 'good' ? 'ink' : 'outline'}>{FIT_LABEL[match.fit]}</Badge>
        <DemoTag>Demonstration record</DemoTag>
      </div>

      <dl className="mt-4 divide-y divide-line rounded-xl border border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 px-4 py-3 text-sm sm:grid-cols-[11rem_1fr]">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">Why it matches you</h3>
          <ul className="mt-2 space-y-1.5">
            {match.reasons.map((r) => (
              <li key={r} className="flex gap-2 text-sm">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-veld-600" strokeWidth={3} />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Things to check</h3>
          <ul className="mt-2 space-y-1.5">
            {match.cautions.length === 0 && <li className="text-sm text-muted">Nothing flagged for your profile.</li>}
            {match.cautions.map((c) => (
              <li key={c} className="flex gap-2 text-sm text-amber-800">
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-5 rounded-xl bg-paper p-4" aria-label={`${institution.shortName} official links`}>
        <p className="text-sm text-muted">
          Fees, APS guides and subject requirements here are demonstration figures. Confirm everything and apply on {institution.shortName}’s official site.
        </p>
        <InstitutionLinks inst={institution} compact className="mt-3" />
      </section>
    </Modal>
  );
}
