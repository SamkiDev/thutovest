import { useId } from 'react';
import { Building, GraduationCap, Laptop, School, Users } from 'lucide-react';
import type { ApplicationProgress, DocumentKey, EducationStage, FundingNeed, IncomeBand, LivingArrangement, Province, StudyField, StudyModePreference } from '../../types';
import { isEnrolledDraft, type ProfileDraft, type ProfileErrors } from '../../utils/validation';
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
import { INSTITUTIONS, TVET_AS_INSTITUTIONS } from '../../data/institutions';
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
      <ChoiceCards<'yes' | 'no'>
        legend="Do you have a disability? (optional)"
        description="Some bursaries are only for students with a disability. Sponsors only see yes or no, never details."
        options={[
          { value: 'no', label: 'No, or I’d rather not say' },
          { value: 'yes', label: 'Yes' },
        ]}
        value={draft.hasDisability ? 'yes' : 'no'}
        onChange={(v) => update({ hasDisability: v === 'yes' })}
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
  const enrolled = isEnrolledDraft(draft);
  const max = enrolled ? 1 : 3;
  const toggleInstitution = (id: string) => {
    const has = draft.preferredInstitutionIds.includes(id);
    // Enrolled students study at one place: picking another replaces it.
    if (enrolled) return update({ preferredInstitutionIds: has ? [] : [id] });
    if (!has && draft.preferredInstitutionIds.length >= 3) return;
    update({ preferredInstitutionIds: has ? draft.preferredInstitutionIds.filter((x) => x !== id) : [...draft.preferredInstitutionIds, id] });
  };
  return (
    <div className="space-y-8">
      <ChipGroup<StudyField>
        legend={enrolled ? 'What are you studying?' : 'Which field interests you most?'}
        description={enrolled ? 'Pick the field closest to your qualification.' : 'Pick one. You can explore other fields later.'}
        options={FIELDS}
        selected={draft.field ? [draft.field] : []}
        onToggle={(v) => update({ field: v })}
        error={errors.field}
      />
      <ChoiceCards<StudyModePreference>
        legend={enrolled ? 'How do you study?' : 'How would you like to study?'}
        options={STUDY_MODES.map((m) => ({ ...m, icon: m.value === 'distance' ? <Laptop aria-hidden className="size-5" /> : <Building aria-hidden className="size-5" /> }))}
        value={draft.studyMode}
        onChange={(v) => update({ studyMode: v })}
        columns={4}
      />
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-ink">{enrolled ? 'Where do you study?' : 'Preferred institutions'}</legend>
        <p className="-mt-0.5 mb-3 text-xs text-muted">
          {enrolled
            ? 'Choose your university or college, so sponsors and residence rules match where you are.'
            : `Optional. Choose up to three (${draft.preferredInstitutionIds.length}/3 selected).`}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {INSTITUTIONS.map((i) => {
            const on = draft.preferredInstitutionIds.includes(i.id);
            const disabled = !enrolled && !on && draft.preferredInstitutionIds.length >= max;
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
                  type={enrolled ? 'radio' : 'checkbox'}
                  name={enrolled ? 'study-institution' : undefined}
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
        {enrolled && (
          <div className="mt-4 sm:max-w-md">
            <SelectField
              label="Or, at a TVET college?"
              hint="All 50 public TVET colleges."
              value={TVET_AS_INSTITUTIONS.some((c) => c.id === draft.preferredInstitutionIds[0]) ? draft.preferredInstitutionIds[0] : ''}
              onChange={(e) => update({ preferredInstitutionIds: e.target.value ? [e.target.value] : [] })}
              options={[{ value: '', label: 'Choose your college' }, ...TVET_AS_INSTITUTIONS.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
        )}
      </fieldset>
      {enrolled ? (
        <p className="rounded-xl bg-sunken p-3 text-sm text-body">
          No APS needed: you are already studying. After this, add your marks in <b>Marks and progress</b> so you can keep your funding.
        </p>
      ) : (
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
      )}
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
  const enrolled = isEnrolledDraft(draft);
  return (
    <div className="space-y-8">
      {!enrolled && (
        <ChoiceCards<ApplicationProgress>
          legend="How far are you with applications?"
          options={APPLICATION_PROGRESS}
          value={draft.applicationProgress}
          onChange={(v) => update({ applicationProgress: v })}
          columns={3}
        />
      )}
      <ChipGroup<DocumentKey>
        legend="Which documents do you already have ready?"
        description="Checklist only. Don’t upload anything here."
        options={enrolled ? DOCUMENTS.map((d) => (d.value === 'latest-results' ? { ...d, label: 'Latest academic record' } : d)) : DOCUMENTS}
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
