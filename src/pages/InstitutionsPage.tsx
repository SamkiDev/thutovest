import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BedDouble, MapPin, Search, Star } from 'lucide-react';
import type { InstitutionType, Province } from '../types';
import { useStudent } from '../hooks/useStudent';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader, EmptyState } from '../components/ui/Misc';
import { Badge } from '../components/ui/Badge';
import { Ext, InstitutionLinks } from '../components/study-options/InstitutionLinks';
import { TvetColleges } from '../components/institutions/TvetColleges';
import { PrivateCollegeCheck } from '../components/institutions/PrivateCollegeCheck';
import { INSTITUTIONS, LINKS_CHECKED_ON, CAO_LINK } from '../data/institutions';
import { RESIDENCE_PAGES } from '../data/accommodation';
import { INSTITUTION_TYPE_LABEL, PROVINCES } from '../data/labels';
import { STUDY_OPTIONS } from '../data/studyOptions';
import { cn } from '../utils/cn';

const TABS = [
  { id: 'universities', label: 'Universities' },
  { id: 'tvet', label: 'TVET colleges' },
  { id: 'private', label: 'Check a private college' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function InstitutionsPage() {
  const { state } = useStudent();
  const [params, setParams] = useSearchParams();
  const tab: TabId = TABS.some((t) => t.id === params.get('tab')) ? (params.get('tab') as TabId) : 'universities';
  useDocumentTitle('Universities and colleges');

  return (
    <div>
      <PageHeader
        title="Universities and colleges"
        description="Official application, funding and residence pages for public universities and all 50 public TVET colleges, plus a check for private colleges. Apply on the institution’s own site; keep your documents and deadlines here."
      />

      <div role="tablist" aria-label="Institution type" className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`inst-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls="inst-panel"
            onClick={() => setParams(t.id === 'universities' ? {} : { tab: t.id }, { replace: true })}
            className={cn(
              'inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors',
              tab === t.id ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-body hover:border-ink-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="inst-panel" role="tabpanel" aria-labelledby={`inst-tab-${tab}`}>
        {tab === 'universities' && <Universities />}
        {tab === 'tvet' && <TvetColleges defaultProvince={state.profile.province} />}
        {tab === 'private' && <PrivateCollegeCheck />}
      </div>
    </div>
  );
}

function Universities() {
  const { state, dispatch } = useStudent();
  const notify = useToast();
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState<'all' | Province>('all');
  const [type, setType] = useState<'all' | InstitutionType>('all');

  const preferred = state.profile.preferredInstitutionIds;
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INSTITUTIONS.filter(
      (i) =>
        (province === 'all' || i.province === province) &&
        (type === 'all' || i.type === type) &&
        (!q || `${i.name} ${i.shortName} ${i.city}`.toLowerCase().includes(q)),
    ).sort((a, b) => Number(preferred.includes(b.id)) - Number(preferred.includes(a.id)) || a.name.localeCompare(b.name));
  }, [query, province, type, preferred]);

  const toggle = (id: string, name: string) => {
    const on = preferred.includes(id);
    if (!on && preferred.length >= 3) {
      notify('You can keep up to three institutions on your list. Remove one first.', 'info');
      return;
    }
    dispatch({
      type: 'updateProfile',
      profile: { ...state.profile, preferredInstitutionIds: on ? preferred.filter((x) => x !== id) : [...preferred, id] },
    });
    notify(on ? `Removed ${name} from your list.` : `Added ${name} to your list. Your recommendations have been updated.`, on ? 'info' : 'success');
  };

  const selectCls = 'h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none';

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem_14rem]">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <label htmlFor="inst-q" className="sr-only">
            Search institutions
          </label>
          <input id="inst-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or city" className={cn(selectCls, 'pl-10')} />
        </div>
        <div>
          <label htmlFor="inst-prov" className="sr-only">
            Province
          </label>
          <select id="inst-prov" value={province} onChange={(e) => setProvince(e.target.value as 'all' | Province)} className={selectCls}>
            <option value="all">All provinces</option>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inst-type" className="sr-only">
            Institution type
          </label>
          <select id="inst-type" value={type} onChange={(e) => setType(e.target.value as 'all' | InstitutionType)} className={selectCls}>
            <option value="all">All types</option>
            <option value="university">Universities</option>
            <option value="university-of-technology">Universities of Technology</option>
          </select>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-paper p-3 text-sm text-muted">
        KwaZulu-Natal institutions such as DUT and UKZN take applications through the{' '}
        <a href={CAO_LINK.url} target="_blank" rel="noreferrer" className="font-semibold text-veld-700 hover:underline">
          Central Applications Office
        </a>
        . Closing dates differ per programme, so check them on each official site.
      </p>

      {list.length === 0 ? (
        <EmptyState className="mt-6" icon={<Search aria-hidden className="size-5" />} title="No institutions match">
          Try another province or clear the search.
        </EmptyState>
      ) : (
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {list.map((i) => {
            const on = preferred.includes(i.id);
            const options = STUDY_OPTIONS.filter((o) => o.institutionId === i.id).length;
            return (
              <li key={i.id} className={cn('card flex flex-col p-5', on && 'border-veld-200')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{i.name}</h2>
                      {on && <Badge tone="veld">On your list</Badge>}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                      <MapPin aria-hidden className="size-3.5" />
                      {i.city}, {i.province}. {INSTITUTION_TYPE_LABEL[i.type]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(i.id, i.shortName)}
                    aria-pressed={on}
                    aria-label={on ? `Remove ${i.shortName} from your list` : `Add ${i.shortName} to your list`}
                    className={cn('grid size-10 shrink-0 place-items-center rounded-full', on ? 'bg-veld-50 text-veld-600' : 'text-muted hover:bg-sunken hover:text-ink')}
                  >
                    <Star aria-hidden className={cn('size-5', on && 'fill-current')} />
                  </button>
                </div>
                <InstitutionLinks inst={i} className="mt-4" />
                {RESIDENCE_PAGES[i.id] && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Ext link={{ label: 'Residence', url: RESIDENCE_PAGES[i.id]!.link.url }} icon={<BedDouble aria-hidden className="size-3.5" />} />
                  </div>
                )}
                <div className="mt-auto pt-4 text-sm">
                  {options > 0 ? (
                    <Link to={`/app/explore?institution=${i.id}`} className="font-semibold text-veld-700 hover:underline underline-offset-4">
                      See {options} {options === 1 ? 'option' : 'options'} in the Study Explorer
                    </Link>
                  ) : (
                    <span className="text-muted">No demo qualifications listed yet</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-xs text-subtle">Official links checked on {LINKS_CHECKED_ON}. If a page has moved, use the institution’s website link.</p>
    </div>
  );
}
