import { useMemo, useState } from 'react';
import { BedDouble, Globe, MapPin, Search } from 'lucide-react';
import type { Province } from '../../types';
import { PROVINCES } from '../../data/labels';
import { TVET_COLLEGES, TVET_SOURCE } from '../../data/tvetColleges';
import { ACCOMMODATION_CHECKED_ON, NSFAS_PORTALS } from '../../data/accommodation';
import { EmptyState } from '../ui/Misc';
import { Ext } from '../study-options/InstitutionLinks';
import { cn } from '../../utils/cn';

const selectCls =
  'h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none';

/** All 50 public TVET colleges with their own website and NSFAS accommodation portal. */
export function TvetColleges({ defaultProvince }: { defaultProvince?: Province }) {
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState<'all' | Province>(defaultProvince ?? 'all');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TVET_COLLEGES.filter((c) => (province === 'all' || c.province === province) && (!q || c.name.toLowerCase().includes(q)));
  }, [query, province]);

  return (
    <div>
      <p className="rounded-xl bg-paper p-3 text-sm text-muted">
        All 50 public TVET colleges are registered and accredited by the Department of Higher Education and Training, and NSFAS funds approved
        qualifications at every one of them. Apply on the college’s own website or at a campus.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_14rem]">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <label htmlFor="tvet-q" className="sr-only">
            Search TVET colleges
          </label>
          <input id="tvet-q" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search TVET colleges" className={cn(selectCls, 'pl-10')} />
        </div>
        <div>
          <label htmlFor="tvet-prov" className="sr-only">
            Province
          </label>
          <select id="tvet-prov" value={province} onChange={(e) => setProvince(e.target.value as 'all' | Province)} className={selectCls}>
            <option value="all">All provinces</option>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {list.length} of {TVET_COLLEGES.length} colleges
      </p>

      {list.length === 0 ? (
        <EmptyState className="mt-4" icon={<Search aria-hidden className="size-5" />} title="No colleges match">
          Try another province or clear the search.
        </EmptyState>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <li key={c.id} className="card flex flex-col p-5">
              <h3 className="font-sans text-base font-semibold text-ink">{c.name}</h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                <MapPin aria-hidden className="size-3.5" />
                {c.province}. Public TVET college
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Ext link={{ label: 'College website', url: c.website }} primary icon={<Globe aria-hidden className="size-3.5" />} />
                <Ext link={{ label: 'NSFAS accommodation', url: NSFAS_PORTALS[c.portal].url }} icon={<BedDouble aria-hidden className="size-3.5" />} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-subtle">
        College list:{' '}
        <a href={TVET_SOURCE.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
          {TVET_SOURCE.label}
        </a>{' '}
        and the NSFAS accommodation portal map. Websites checked on {ACCOMMODATION_CHECKED_ON}.
      </p>
    </div>
  );
}
