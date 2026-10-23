import { useId } from 'react';
import { Building, GraduationCap, Laptop, School, Users } from 'lucide-react';
import type { ApplicationProgress, DocumentKey, EducationStage, FundingNeed, IncomeBand, LivingArrangement, Province, StudyField, StudyModePreference } from '../../types';
import type { ProfileDraft, ProfileErrors } from '../../utils/validation';
import { ChipGroup, ChoiceCards, MoneyInput, SelectField, TextField } from './Fields';
import {
  APPLICATION_PROGRESS,
  DOCUMENTS,
  EDUCATION_STAGES,
  FIELDS,
  FUNDING_NEED,
  INCOME_BANDS,
  INSTITUTION_TYPE_LABEL,
  LIVING,
  PROVINCES,
  STUDY_MODES,
} from '../../data/labels';
import { INSTITUTIONS } from '../../data/institutions';
import { cn } from '../../utils/cn';

interface SectionProps {
  draft: ProfileDraft;
  update: (patch: Partial<ProfileDraft>) => void;
  errors: ProfileErrors;
}

const STAGE_ICON: Record<EducationStage, typeof School> = {
  grade11: School,
  grade12: School,
  'gap-year': Users,
  'first-year': GraduationCap,
  continuing: GraduationCap,
};

export function AboutSection({ draft, update, errors }: SectionProps) {
  return (
    <div className="space-y-6">
      <TextField
        label="What should we call you?"
        hint="Your first name or a nickname. No ID number or surname needed."
        value={draft.firstName}
        onChange={(e) => update({ firstName: e.target.value })}
        error={errors.firstName}
        autoComplete="given-name"
        maxLength={40}
        className="sm:max-w-sm"
      />
      <ChoiceCards<EducationStage>
        legend="Where are you in your studies?"
        options={EDUCATION_STAGES.map((s) => {
          const Icon = STAGE_ICON[s.value];
          return { ...s, icon: <Icon aria-hidden className="size-5" /> };
        })}
        value={draft.educationStage}
        onChange={(v) => update({ educationStage: v })}
        columns={3}
        error={errors.educationStage}
      />
      <ChoiceCards<'yes' | 'no'>
        legend="Are you 18 or older?"
        description="Under 18? A guardian consents before any sponsor contact."
        options={[
          { value: 'yes', label: 'Yes, 18 or older' },
          { value: 'no', label: 'No, under 18' },
        ]}
        value={draft.isAdult ? 'yes' : 'no'}
        onChange={(v) => update({ isAdult: v === 'yes' })}
        columns={2}
      />
      <SelectField
        label="Which province do you live in?"
        hint="Used to highlight institutions close to home."
        value={draft.province}
        onChange={(e) => update({ province: e.target.value as Province })}
        options={PROVINCES.map((p) => ({ value: p, label: p }))}
        className="sm:max-w-sm"
      />
    </div>
  );
}

export function GoalsSection({ draft, update, errors }: SectionProps) {
  const apsId = useId();
  const toggleInstitution = (id: string) => {
    const has = draft.preferredInstitutionIds.includes(id);
    if (!has && draft.preferredInstitutionIds.length >= 3) return;
    update({ preferredInstitutionIds: has ? draft.preferredInstitutionIds.filter((x) => x !== id) : [...draft.preferredInstitutionIds, id] });
  };
  return (
    <div className="space-y-8">
      <ChipGroup<StudyField>
        legend="Which field interests you most?"
        description="Pick one. You can explore other fields later."
        options={FIELDS}
        selected={draft.field ? [draft.field] : []}
        onToggle={(v) => update({ field: v })}
        error={errors.field}
      />
      <ChoiceCards<StudyModePreference>
        legend="How would you like to study?"
        options={STUDY_MODES.map((m) => ({ ...m, icon: m.value === 'distance' ? <Laptop aria-hidden className="size-5" /> : <Building aria-hidden className="size-5" /> }))}
        value={draft.studyMode}
        onChange={(v) => update({ studyMode: v })}
        columns={4}
      />
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-ink">Preferred institutions</legend>
        <p className="-mt-0.5 mb-3 text-xs text-muted">
          Optional. Choose up to three ({draft.preferredInstitutionIds.length}/3 selected).
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {INSTITUTIONS.map((i) => {
            const on = draft.preferredInstitutionIds.includes(i.id);
            const disabled = !on && draft.preferredInstitutionIds.length >= 3;
            return (
              <label
                key={i.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-veld-200',
                  on ? 'border-veld-500 bg-veld-50/60' : 'border-line-strong bg-surface hover:border-ink-300',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={disabled}
                  onChange={() => toggleInstitution(i.id)}
                  className="size-4 shrink-0 accent-[var(--color-veld-600)]"
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{i.shortName}</span>
                  <span className="block truncate text-xs text-muted">
                    {INSTITUTION_TYPE_LABEL[i.type]}, {i.city}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {errors.preferredInstitutionIds && <p className="mt-1.5 text-xs font-medium text-clay-600">{errors.preferredInstitutionIds}</p>}
      </fieldset>
      <div className="sm:max-w-xs">
        <label htmlFor={apsId} className="mb-1.5 block text-sm font-semibold text-ink">
          Estimated APS <span className="ml-1 font-normal text-subtle">Optional</span>
        </label>
        <input
          id={apsId}
          type="number"
          inputMode="numeric"
          min={0}
          max={49}
          value={draft.apsEstimate ?? ''}
          onChange={(e) => update({ apsEstimate: e.target.value === '' ? null : Number(e.target.value) })}
          aria-describedby={`${apsId}-h`}
          aria-invalid={errors.apsEstimate ? true : undefined}
          className={cn(
            'num h-12 w-full rounded-xl border bg-surface px-4 text-[0.9375rem] focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none',
            errors.apsEstimate ? 'border-clay-500' : 'border-line-strong',
          )}
        />
        <p id={`${apsId}-h`} className={cn('mt-1.5 text-xs', errors.apsEstimate ? 'font-medium text-clay-600' : 'text-muted')}>
          {errors.apsEstimate ?? 'Your Admission Point Score from your latest results, if you know it.'}
        </p>
      </div>
    </div>
  );
}

export function MoneySection({ draft, update, errors }: SectionProps) {
  const budgetId = useId();
  return (
    <div className="space-y-8">
      <div>
        <label htmlFor={budgetId} className="mb-1.5 block text-sm font-semibold text-ink">
          Roughly how much can you or your family put towards study each year?
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <MoneyInput id={budgetId} value={draft.annualBudget} onChange={(v) => update({ annualBudget: v })} className="w-full sm:w-52" invalid={Boolean(errors.annualBudget)} describedBy={`${budgetId}-h`} />
          {[0, 10000, 25000, 50000].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => update({ annualBudget: v })}
              className={cn(
                'h-9 rounded-full border px-3 text-sm font-medium',
                draft.annualBudget === v ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-body hover:border-ink-300',
              )}
            >
              R{v.toLocaleString('en-ZA').replace(/[\s  ]/g, ',')}
            </button>
          ))}
        </div>
        <p id={`${budgetId}-h`} className={cn('mt-1.5 text-xs', errors.annualBudget ? 'font-medium text-clay-600' : 'text-muted')}>
          {errors.annualBudget ?? 'An estimate is fine. You can change it any time in the Funding Gap Solver.'}
        </p>
      </div>
      <ChoiceCards<LivingArrangement>
        legend="Where do you plan to live while studying?"
        options={LIVING}
        value={draft.livingArrangement}
        onChange={(v) => update({ livingArrangement: v })}
        columns={3}
      />
      <ChoiceCards<FundingNeed>
        legend="Will you need funding assistance?"
        options={FUNDING_NEED}
        value={draft.fundingNeed}
        onChange={(v) => update({ fundingNeed: v })}
        columns={3}
      />
      <ChoiceCards<IncomeBand>
        legend="Combined household income (optional)"
        description="Helps match funding. You can choose not to say."
        options={INCOME_BANDS}
        value={draft.householdIncome}
        onChange={(v) => update({ householdIncome: v })}
        columns={2}
      />
    </div>
  );
}

export function ApplicationSection({ draft, update }: SectionProps) {
  return (
    <div className="space-y-8">
      <ChoiceCards<ApplicationProgress>
        legend="How far are you with applications?"
        options={APPLICATION_PROGRESS}
        value={draft.applicationProgress}
        onChange={(v) => update({ applicationProgress: v })}
        columns={3}
      />
      <ChipGroup<DocumentKey>
        legend="Which documents do you already have ready?"
        description="Checklist only. Don’t upload anything here."
        options={DOCUMENTS}
        selected={draft.documentsReady}
        multiple
        onToggle={(v) =>
          update({
            documentsReady: draft.documentsReady.includes(v) ? draft.documentsReady.filter((d) => d !== v) : [...draft.documentsReady, v],
          })
        }
      />
    </div>
  );
}
