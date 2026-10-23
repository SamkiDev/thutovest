import { useMemo, useState } from 'react';
import { CircleCheck, CircleHelp, CircleX, ExternalLink, Search, TriangleAlert } from 'lucide-react';
import { PRIVATE_HE_REGISTER, REGISTER_PDF, REGISTER_UPDATED, type RegisterEntry, type RegisterStatus } from '../../data/privateRegister';
import { Badge } from '../ui/Badge';
import { Ext } from '../study-options/InstitutionLinks';
import { Why } from '../ui/Why';

const STATUS: Record<RegisterStatus, { label: string; tone: 'veld' | 'amber' | 'clay'; detail: string }> = {
  registered: {
    label: 'Registered',
    tone: 'veld',
    detail: 'Listed as registered with DHET as a private higher education institution.',
  },
  provisional: {
    label: 'Provisionally registered',
    tone: 'amber',
    detail: 'Listed as provisionally registered: it has not met every registration requirement yet and has conditions to meet in a set time.',
  },
  cancelled: {
    label: 'Registration cancelled',
    tone: 'clay',
    detail: 'Listed under institutions whose registration is cancelled. The register notes these institutions may appeal to the Minister within 60 days.',
  },
};

const WHO_DOES_WHAT = [
  { who: 'DHET', what: 'Registers private colleges. Offering qualifications without registration is illegal.' },
  { who: 'CHE, Umalusi and QCTO', what: 'Accredit qualifications: CHE for higher education, Umalusi for school level, QCTO for trades.' },
  { who: 'SAQA', what: 'Records qualifications on the NQF. It doesn’t register colleges, so “SAQA accredited college” means nothing.' },
  { who: 'NSFAS', what: 'Funds public universities and TVET colleges only, not private colleges.' },
];

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/\((pty|rf)\)|\bltd\b|\bnpc\b|\bpty\b|\bthe\b|[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function matches(query: string): RegisterEntry[] {
  const q = normalise(query);
  if (q.length < 3) return [];
  const words = q.split(' ');
  return PRIVATE_HE_REGISTER.filter((e) => {
    const n = normalise(e.name);
    return words.every((w) => n.includes(w));
  }).slice(0, 8);
}

/** Search the DHET register of private higher education institutions, with plain-language results. */
export function PrivateCollegeCheck() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => matches(query), [query]);
  const searched = normalise(query).length >= 3;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="pcc-heading" className="card p-5 sm:p-6">
        <h2 id="pcc-heading" className="text-lg font-semibold">
          Is this private college registered?
        </h2>
        <p className="mt-1 text-sm text-muted">
          The official DHET register, updated {REGISTER_UPDATED}. {PRIVATE_HE_REGISTER.length} institutions.
        </p>

        <div className="relative mt-4">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <label htmlFor="pcc-q" className="sr-only">
            College name
          </label>
          <input
            id="pcc-q"
            type="search"
            value={query}
            maxLength={80}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type the college’s name"
            className="h-11 w-full rounded-xl border border-line-strong bg-surface pr-3 pl-10 text-sm font-medium focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
          />
        </div>

        <div aria-live="polite" className="mt-4">
          {!searched ? (
            <p className="text-sm text-muted">Type at least three letters of the name on the college’s advert or website.</p>
          ) : results.length === 0 ? (
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <p className="flex items-center gap-2 font-semibold">
                <CircleHelp aria-hidden className="size-4 shrink-0" />
                Not found in this copy of the register
              </p>
              <p className="mt-1.5">Ask for their DHET registration number before you pay.</p>
              <Why className="mt-1">
                That alone doesn’t prove it’s fake: the registered company name can differ from the brand name, and providers that only offer QCTO
                trade and occupational programmes register with the QCTO, not DHET.
              </Why>
            </div>
          ) : (
            <ul className="space-y-3">
              {results.map((e) => {
                const s = STATUS[e.status];
                const Icon = e.status === 'registered' ? CircleCheck : e.status === 'provisional' ? TriangleAlert : CircleX;
                return (
                  <li key={`${e.name}-${e.status}`} className="rounded-xl border border-line p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 font-semibold text-ink [overflow-wrap:anywhere]">{e.name}</p>
                      <Badge tone={s.tone} icon={<Icon aria-hidden className="size-3.5" />}>
                        {s.label}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-body">{s.detail}</p>
                    <p className="mt-1 text-xs text-muted">
                      {e.registrationNumber ? `Registration number ${e.registrationNumber}` : 'Registration number: see the official register'}
                      {e.province ? `. ${e.province}` : ''}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="mt-4 text-sm text-muted">
          Registration covers the college, not every course. Check yours on SAQA.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Ext link={{ label: 'DHET register (PDF)', url: REGISTER_PDF }} primary />
          <Ext link={{ label: 'Search SAQA', url: 'https://allqs.saqa.org.za/' }} />
        </div>
      </section>

      <aside aria-labelledby="who-heading" className="space-y-4">
        <section className="card p-5">
          <h2 id="who-heading" className="text-base font-semibold">
            Who checks what
          </h2>
          <dl className="mt-3 space-y-3 text-sm">
            {WHO_DOES_WHAT.map((r) => (
              <div key={r.who}>
                <dt className="font-semibold text-ink">{r.who}</dt>
                <dd className="mt-0.5 text-body">{r.what}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {[
              ['SAQA', 'https://www.saqa.org.za'],
              ['CHE', 'https://www.che.ac.za'],
              ['Umalusi', 'https://www.umalusi.org.za'],
              ['QCTO', 'https://www.qcto.org.za'],
            ].map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-veld-700 hover:underline underline-offset-4">
                {label}
                <ExternalLink aria-hidden className="size-3" />
                <span className="sr-only">(official site, opens in a new tab)</span>
              </a>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-clay-50 p-5 text-sm text-clay-700">
          <h2 className="font-sans text-base font-semibold">If you think you enrolled at a fake college</h2>
          <p className="mt-1.5">
            Stop paying, keep receipts, and report it to DHET and SAQA: 0800 87 22 22.
          </p>
        </section>
      </aside>
    </div>
  );
}
