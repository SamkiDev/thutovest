import { useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Bookmark, GitCompareArrows, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import type { QualificationType, StudyMatch, StudyMode } from '../types';
import { useStudent } from '../hooks/useStudent';
import { useOptionActions } from '../hooks/useOptionActions';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader, EmptyState } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { DemoTag } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { OptionCard } from '../components/study-options/OptionCard';
import { FIELDS, MODE_LABEL } from '../data/labels';
import { INSTITUTIONS } from '../data/institutions';
import { FIT_LABEL, fieldLabel } from '../utils/matching';
import { formatZAR } from '../utils/format';
import { cn } from '../utils/cn';

type Sort = 'fit' | 'cost' | 'duration';
const MAX_TUITION = 80000;

const selectCls =
  'h-11 w-full appearance-none rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium text-ink focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none';

export default function ExplorePage() {
  const { state, engine, dispatch } = useStudent();
  const actions = useOptionActions();
  const location = useLocation();
  useDocumentTitle('Study Explorer');

  const initialSort = new URLSearchParams(location.search).get('sort') === 'cost' ? 'cost' : 'fit';
  const [query, setQuery] = useState('');
  const [field, setField] = useState<string>(state.profile.field);
  const [mode, setMode] = useState<'any' | StudyMode>('any');
  const [institution, setInstitution] = useState(() => new URLSearchParams(location.search).get('institution') ?? 'any');
  const [type, setType] = useState<'any' | QualificationType>('any');
  const [maxTuition, setMaxTuition] = useState(MAX_TUITION);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>(initialSort);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = engine.matches.filter((m) => {
      if (field !== 'all' && m.option.field !== field) return false;
      if (mode !== 'any' && !m.option.modes.includes(mode)) return false;
      if (institution !== 'any' && m.institution.id !== institution) return false;
      if (type !== 'any' && m.option.type !== type) return false;
      if (m.option.indicativeTuition > maxTuition) return false;
      if (savedOnly && !state.savedOptionIds.includes(m.option.id)) return false;
      if (q) {
        const hay = [m.option.qualification, m.institution.name, m.institution.shortName, fieldLabel(m.option.field), ...m.option.careers].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...list];
    if (sort === 'cost') sorted.sort((a, b) => a.option.indicativeTuition - b.option.indicativeTuition);
    if (sort === 'duration') sorted.sort((a, b) => a.option.durationYears - b.option.durationYears || b.score - a.score);
    return sorted;
  }, [engine.matches, query, field, mode, institution, type, maxTuition, savedOnly, sort, state.savedOptionIds]);

  const activeFilters =
    (field !== state.profile.field ? 1 : 0) + (mode !== 'any' ? 1 : 0) + (institution !== 'any' ? 1 : 0) + (type !== 'any' ? 1 : 0) + (maxTuition < MAX_TUITION ? 1 : 0) + (savedOnly ? 1 : 0);

  const clear = () => {
    setQuery('');
    setField(state.profile.field);
    setMode('any');
    setInstitution('any');
    setType('any');
    setMaxTuition(MAX_TUITION);
    setSavedOnly(false);
  };

  const comparing = state.compareIds.map((id) => engine.matches.find((m) => m.option.id === id)).filter((m): m is StudyMatch => Boolean(m));

  return (
    <div>
      <PageHeader
        title="Study Pathway Explorer"
        description="Search qualifications and see exactly why each one fits your goals, marks and budget."
        kicker={<DemoTag>Fees and entry guides are demonstration figures</DemoTag>}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <label htmlFor="search" className="sr-only">
            Search qualifications, institutions or careers
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search qualifications, institutions or careers"
            className="h-12 w-full rounded-full border border-line-strong bg-surface pr-4 pl-12 text-[0.9375rem] focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="lg:hidden"
            icon={<SlidersHorizontal aria-hidden className="size-4" />}
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-controls="filters"
          >
            Filters{activeFilters > 0 && ` (${activeFilters})`}
          </Button>
          <label htmlFor="sort" className="sr-only">
            Sort results
          </label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={cn(selectCls, 'h-12 w-auto rounded-full px-4')}>
            <option value="fit">Sort: best fit</option>
            <option value="cost">Sort: lowest tuition</option>
            <option value="duration">Sort: shortest</option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[15.5rem_1fr]">
        <aside id="filters" className={cn('lg:block', filtersOpen ? 'block' : 'hidden')} aria-label="Filters">
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 lg:sticky lg:top-6">
            <Filter label="Field" id="f-field">
              <select id="f-field" value={field} onChange={(e) => setField(e.target.value)} className={selectCls}>
                <option value="all">All fields</option>
                {FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                    {f.value === state.profile.field ? ' (yours)' : ''}
                  </option>
                ))}
              </select>
            </Filter>
            <Filter label="Study mode" id="f-mode">
              <select id="f-mode" value={mode} onChange={(e) => setMode(e.target.value as 'any' | StudyMode)} className={selectCls}>
                <option value="any">Any mode</option>
                {(['contact', 'distance', 'blended'] as StudyMode[]).map((m) => (
                  <option key={m} value={m}>
                    {MODE_LABEL[m]}
                  </option>
                ))}
              </select>
            </Filter>
            <Filter label="Institution" id="f-inst">
              <select id="f-inst" value={institution} onChange={(e) => setInstitution(e.target.value)} className={selectCls}>
                <option value="any">All institutions</option>
                {INSTITUTIONS.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.shortName}, {i.city}
                  </option>
                ))}
              </select>
            </Filter>
            <Filter label="Qualification type" id="f-type">
              <select id="f-type" value={type} onChange={(e) => setType(e.target.value as 'any' | QualificationType)} className={selectCls}>
                <option value="any">Any type</option>
                <option value="Degree">Degree</option>
                <option value="Diploma">Diploma</option>
                <option value="Higher Certificate">Higher Certificate</option>
              </select>
            </Filter>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="f-cost" className="text-sm font-semibold text-ink">
                  Max tuition / year
                </label>
                <span className="num text-sm font-semibold text-veld-700">{maxTuition >= MAX_TUITION ? 'Any' : formatZAR(maxTuition)}</span>
              </div>
              <input
                id="f-cost"
                type="range"
                min={15000}
                max={MAX_TUITION}
                step={2500}
                value={maxTuition}
                onChange={(e) => setMaxTuition(Number(e.target.value))}
                aria-valuetext={maxTuition >= MAX_TUITION ? 'Any amount' : formatZAR(maxTuition)}
                className="w-full accent-[var(--color-veld-600)]"
              />
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-paper px-3 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Bookmark aria-hidden className="size-4" /> Saved only
                <span className="num font-normal text-muted">({state.savedOptionIds.length})</span>
              </span>
              <input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} className="size-4 accent-[var(--color-veld-600)]" />
            </label>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="w-full" onClick={clear}>
                Clear filters
              </Button>
            )}
          </div>
        </aside>

        <div>
          <p className="mb-3 text-sm text-muted" aria-live="polite">
            {results.length} {results.length === 1 ? 'option' : 'options'}
            {field !== 'all' ? ` in ${fieldLabel(field)}` : ' across all fields'}
            {field === state.profile.field && (
              <>
                {' '}
                <button type="button" onClick={() => setField('all')} className="font-semibold text-veld-700 hover:underline">
                  Show all fields
                </button>
              </>
            )}
          </p>
          {results.length === 0 ? (
            <EmptyState
              icon={<SearchX aria-hidden className="size-5" />}
              title={savedOnly ? 'Nothing saved with these filters' : 'No options match'}
              action={<Button variant="secondary" onClick={clear}>Clear search and filters</Button>}
            >
              {savedOnly ? 'Save options with the bookmark button to build your shortlist.' : 'Try a wider tuition limit, another study mode or a different search term.'}
            </EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((m) => (
                <OptionCard
                  key={m.option.id}
                  match={m}
                  saved={actions.isSaved(m.option.id)}
                  comparing={state.compareIds.includes(m.option.id)}
                  compareDisabled={state.compareIds.length >= 3}
                  onToggleSave={() => actions.toggleSave(m)}
                  onToggleCompare={() => actions.toggleCompare(m)}
                  onView={() => actions.openDetail(m.option.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {comparing.length > 0 && (
        <div className="fixed inset-x-0 bottom-[4.5rem] z-20 px-3 lg:bottom-5 lg:left-[17rem] lg:px-10">
          <div className="rise mx-auto flex max-w-3xl items-center gap-3 rounded-2xl bg-ink p-3 pl-4 text-white shadow-lift">
            <GitCompareArrows aria-hidden className="hidden size-5 shrink-0 text-veld-300 sm:block" />
            <ul className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
              {comparing.map((m) => (
                <li key={m.option.id} className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 py-1 pr-1 pl-3 text-xs font-medium">
                  {m.institution.shortName}: {m.option.qualification.length > 22 ? `${m.option.qualification.slice(0, 22)}…` : m.option.qualification}
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'toggleCompare', optionId: m.option.id })}
                    className="grid size-6 place-items-center rounded-full hover:bg-white/20"
                    aria-label={`Remove ${m.option.qualification} from comparison`}
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="light" onClick={() => setCompareOpen(true)} disabled={comparing.length < 2}>
              Compare {comparing.length}
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={compareOpen && comparing.length > 0}
        onClose={() => setCompareOpen(false)}
        title="Compare options"
        description="Side by side using your profile. Fees and APS guides are demonstration figures."
        size="xl"
        footer={
          <Button
            variant="secondary"
            onClick={() => {
              dispatch({ type: 'clearCompare' });
              setCompareOpen(false);
            }}
          >
            Clear comparison
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">Comparison of selected study options</caption>
            <thead>
              <tr>
                <th scope="col" className="w-36 pb-3 text-xs font-semibold text-muted">
                  <span className="sr-only">Attribute</span>
                </th>
                {comparing.map((m) => (
                  <th key={m.option.id} scope="col" className="px-3 pb-3 align-top font-display text-base font-semibold text-ink">
                    {m.option.qualification}
                    <span className="block font-sans text-xs font-normal text-muted">{m.institution.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <CompareRow label="Fit for you" values={comparing.map((m) => FIT_LABEL[m.fit])} />
              <CompareRow label="Tuition / year" values={comparing.map((m) => formatZAR(m.option.indicativeTuition))} best={bestIndex(comparing, (m) => -m.option.indicativeTuition)} />
              <CompareRow
                label="Total tuition"
                values={comparing.map((m) => formatZAR(m.option.indicativeTuition * m.option.durationYears))}
                best={bestIndex(comparing, (m) => -m.option.indicativeTuition * m.option.durationYears)}
              />
              <CompareRow label="Duration" values={comparing.map((m) => `${m.option.durationYears} ${m.option.durationYears === 1 ? 'year' : 'years'}`)} />
              <CompareRow label="Type" values={comparing.map((m) => `${m.option.type} (NQF ${m.option.nqfLevel})`)} />
              <CompareRow label="Study mode" values={comparing.map((m) => m.option.modes.map((x) => MODE_LABEL[x]).join(', '))} />
              <CompareRow label="Sample APS guide" values={comparing.map((m) => String(m.option.apsGuide))} />
              <CompareRow label="Subjects" values={comparing.map((m) => m.option.subjects)} />
              <CompareRow label="To check" values={comparing.map((m) => m.cautions[0] ?? 'Nothing flagged')} />
            </tbody>
          </table>
        </div>
      </Modal>
      {actions.modal}
    </div>
  );
}

function bestIndex(list: StudyMatch[], score: (m: StudyMatch) => number) {
  let best = 0;
  list.forEach((m, i) => {
    if (score(m) > score(list[best])) best = i;
  });
  return best;
}

function CompareRow({ label, values, best }: { label: string; values: string[]; best?: number }) {
  return (
    <tr>
      <th scope="row" className="py-3 pr-3 text-xs font-semibold text-muted">
        {label}
      </th>
      {values.map((v, i) => (
        <td key={i} className={cn('px-3 py-3 align-top text-body', best === i && 'font-semibold text-veld-700')}>
          {v}
          {best === i && <span className="sr-only"> (lowest)</span>}
        </td>
      ))}
    </tr>
  );
}

function Filter({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}
