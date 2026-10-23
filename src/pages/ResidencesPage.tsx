import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, CircleCheck, CircleX, ExternalLink, TriangleAlert } from 'lucide-react';
import type { LivingArrangement } from '../types';
import { useStudent } from '../hooks/useStudent';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader, SectionTitle } from '../components/ui/Misc';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ChoiceCards, MoneyInput, SelectField } from '../components/forms/Fields';
import { Ext } from '../components/study-options/InstitutionLinks';
import { INSTITUTIONS, institutionById } from '../data/institutions';
import { TVET_COLLEGES } from '../data/tvetColleges';
import {
  ACCOMMODATION_CHECKED_ON,
  NSFAS_ACCOMMODATION_RULES,
  NSFAS_PORTALS,
  NSFAS_SOURCES,
  OTHER_UNIVERSITY_PORTALS,
  RESIDENCE_PAGES,
  type NsfasPortalId,
} from '../data/accommodation';
import { PROVINCES } from '../data/labels';
import { checkPlace, WARNING_SIGNS, type Accreditation, type PlaceKind, type WarningSign } from '../intelligence/accommodationCheck';
import { summariseFunding } from '../utils/funding';
import { formatZAR } from '../utils/format';
import { cn } from '../utils/cn';

const LIVING_LABEL: Record<LivingArrangement, string> = { home: 'living at home', residence: 'a university or college residence', private: 'private accommodation' };
const KIND_TO_LIVING: Record<PlaceKind, LivingArrangement> = { residence: 'residence', private: 'private', family: 'home' };

export default function ResidencesPage() {
  const { state } = useStudent();
  useDocumentTitle('Residences');
  const preferred = state.profile.preferredInstitutionIds.map(institutionById).filter((i) => i !== undefined);

  return (
    <div>
      <PageHeader
        title="Residences"
        description="Find your institution’s residence application, check a private place before you pay anything, and see what NSFAS will and won’t pay for."
      />

      <section aria-labelledby="your-res" className="card p-5 sm:p-6">
        <SectionTitle
          id="your-res"
          title="Your residence applications"
          description={
            <>
              Your plan uses {LIVING_LABEL[state.profile.livingArrangement]} at {formatZAR(state.costs.accommodation)} a year. Residence places are limited, so apply when you apply
              to study.
            </>
          }
        />
        {preferred.length === 0 ? (
          <p className="text-sm text-muted">
            Star up to three institutions on the{' '}
            <Link to="/app/institutions" className="font-semibold text-veld-700 hover:underline underline-offset-4">
              Universities and colleges
            </Link>{' '}
            page to see their residence links here.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {preferred.map((inst) => {
              const res = RESIDENCE_PAGES[inst.id];
              return (
                <li key={inst.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{inst.name}</p>
                    <p className="text-sm text-muted">{res ? `NSFAS portal: ${NSFAS_PORTALS[res.portal].host}` : 'Distance learning: no residences'}</p>
                  </div>
                  {res && (
                    <div className="flex flex-wrap gap-2">
                      <Ext link={{ label: 'Apply for residence', url: res.link.url }} primary icon={<BedDouble aria-hidden className="size-3.5" />} />
                      <Ext link={{ label: 'NSFAS accommodation', url: NSFAS_PORTALS[res.portal].url }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <PlaceChecker />

      <section aria-labelledby="nsfas-rules" className="mt-10">
        <SectionTitle
          id="nsfas-rules"
          title="What NSFAS pays for in 2026"
          description="From the NSFAS eligibility criteria for the 2026 academic year. Each rule shows where it is written."
        />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {NSFAS_ACCOMMODATION_RULES.map((r) => (
            <li key={r.id} className="card p-5">
              <h3 className="font-sans text-base font-semibold text-ink">{r.title}</h3>
              <p className="mt-1.5 text-sm text-body">{r.body}</p>
              <p className="mt-3 text-xs text-subtle">{r.source}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Ext link={NSFAS_SOURCES.guidelines} />
          <Ext link={NSFAS_SOURCES.accommodation} />
        </div>
      </section>

      <PortalFinder />

      <p className="mt-8 text-xs text-subtle">
        Official links and NSFAS rules checked on {ACCOMMODATION_CHECKED_ON}. NSFAS publishes allowance amounts yearly; this page doesn’t show cap amounts because no official 2026 figure
        could be confirmed.
      </p>
    </div>
  );
}

function PlaceChecker() {
  const { state, dispatch } = useStudent();
  const notify = useToast();
  const nsfasStatus = state.opportunityStatus.nsfas ?? 'not-started';
  const [kind, setKind] = useState<PlaceKind>('private');
  const [accreditation, setAccreditation] = useState<Accreditation>('unsure');
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [months, setMonths] = useState(10);
  const [nsfasFunded, setNsfasFunded] = useState(nsfasStatus !== 'unsuccessful');
  const [appliedForResidence, setAppliedForResidence] = useState(false);
  const [signs, setSigns] = useState<WarningSign[]>([]);

  const result = useMemo(
    () => checkPlace({ kind, accreditation, monthlyRent, months, nsfasFunded, appliedForResidence, signs, plannedAccommodation: state.costs.accommodation }),
    [kind, accreditation, monthlyRent, months, nsfasFunded, appliedForResidence, signs, state.costs.accommodation],
  );
  const gapNow = summariseFunding(state).gap;
  const canUse = kind === 'family' || monthlyRent > 0;

  const useInPlan = () => {
    const living = KIND_TO_LIVING[kind];
    if (living !== state.profile.livingArrangement) dispatch({ type: 'updateProfile', profile: { ...state.profile, livingArrangement: living } });
    dispatch({ type: 'setCost', key: 'accommodation', value: result.annualCost });
    notify(`Your plan now uses ${formatZAR(result.annualCost)} a year for accommodation. Your funding gap and forecast have been updated.`, 'success');
  };

  const toggleSign = (id: WarningSign) => setSigns((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const VerdictIcon = result.verdict === 'stop' ? CircleX : result.verdict === 'check' ? TriangleAlert : CircleCheck;

  return (
    <section aria-labelledby="checker" className="mt-10">
      <SectionTitle
        id="checker"
        title="Check a place before you pay"
        description="Answer a few questions about a room or residence you’re considering. Nothing you enter here leaves this device."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="card space-y-6 p-5 sm:p-6">
          <ChoiceCards<PlaceKind>
            legend="Where would you stay?"
            columns={3}
            value={kind}
            onChange={setKind}
            options={[
              { value: 'residence', label: 'Institution residence', hint: 'Owned or leased by your institution' },
              { value: 'private', label: 'Private place', hint: 'A room, flat or private residence' },
              { value: 'family', label: 'With family', hint: 'Parents or relatives' },
            ]}
          />

          {kind === 'private' && (
            <SelectField
              label="Is it accredited?"
              hint="Look for it on your institution’s accredited list or your NSFAS accommodation portal. A provider saying so isn’t enough."
              value={accreditation}
              onChange={(e) => setAccreditation(e.target.value as Accreditation)}
              options={[
                { value: 'institution', label: 'Yes, on my institution’s accredited list' },
                { value: 'nsfas', label: 'Yes, on my NSFAS accommodation portal' },
                { value: 'unsure', label: 'I’m not sure' },
                { value: 'no', label: 'No' },
              ]}
            />
          )}

          {kind !== 'family' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rent" className="mb-1.5 block text-sm font-semibold text-ink">
                  Monthly rent
                </label>
                <MoneyInput id="rent" value={monthlyRent} onChange={setMonthlyRent} />
              </div>
              <SelectField
                label="Months you’ll pay for"
                value={String(months)}
                onChange={(e) => setMonths(Number(e.target.value))}
                options={[9, 10, 11, 12].map((m) => ({ value: String(m), label: `${m} months` }))}
              />
            </div>
          )}

          <fieldset className="space-y-3">
            <legend className="mb-1.5 text-sm font-semibold text-ink">About your funding</legend>
            <label className="flex items-start gap-3 text-sm text-body">
              <input type="checkbox" checked={nsfasFunded} onChange={(e) => setNsfasFunded(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-veld-600" />
              I’m funded by NSFAS, or I’m applying
            </label>
            {kind === 'private' && nsfasFunded && (
              <label className="flex items-start gap-3 text-sm text-body">
                <input type="checkbox" checked={appliedForResidence} onChange={(e) => setAppliedForResidence(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-veld-600" />
                I applied for my institution’s residence and it’s full, or it has none
              </label>
            )}
          </fieldset>

          {kind !== 'family' && (
            <fieldset className="space-y-3">
              <legend className="mb-1.5 text-sm font-semibold text-ink">Has the provider done any of this?</legend>
              {WARNING_SIGNS.map((s) => (
                <label key={s.id} className="flex items-start gap-3 text-sm text-body">
                  <input type="checkbox" checked={signs.includes(s.id)} onChange={() => toggleSign(s.id)} className="mt-0.5 size-4 shrink-0 accent-veld-600" />
                  {s.label}
                </label>
              ))}
            </fieldset>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="card p-5 sm:p-6" aria-live="polite">
            <Badge
              tone={result.verdict === 'stop' ? 'clay' : result.verdict === 'check' ? 'amber' : 'veld'}
              icon={<VerdictIcon aria-hidden className="size-3.5" />}
            >
              {result.verdict === 'stop' ? 'Stop' : result.verdict === 'check' ? 'Check first' : 'Looks fine'}
            </Badge>
            <h3 className="mt-3 text-lg font-semibold">{result.headline}</h3>
            <ul className="mt-4 space-y-4">
              {result.findings.map((f) => (
                <li key={f.title} className="flex gap-3">
                  <span
                    aria-hidden
                    className={cn('mt-1.5 size-2 shrink-0 rounded-full', f.tone === 'clay' ? 'bg-clay-500' : f.tone === 'amber' ? 'bg-amber-500' : 'bg-veld-500')}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{f.title}</p>
                    <p className="mt-0.5 text-sm text-body">{f.why}</p>
                    {f.source && <p className="mt-1 text-xs text-subtle">{f.source}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-muted">A year here</dt>
                <dd className="num mt-0.5 font-semibold text-ink">{formatZAR(result.annualCost)}</dd>
              </div>
              <div>
                <dt className="text-muted">Funding gap now</dt>
                <dd className="num mt-0.5 font-semibold text-ink">{formatZAR(gapNow)}</dd>
              </div>
            </dl>
            <Button className="mt-5 w-full" variant={result.verdict === 'stop' ? 'secondary' : 'primary'} disabled={!canUse} onClick={useInPlan}>
              Use this in my plan
            </Button>
            <p className="mt-2 text-xs text-muted">Updates your accommodation cost, funding gap and forecast. You can change it again on the Funding page.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

type PortalRow = { key: string; name: string; province: string; portal: NsfasPortalId };

function PortalFinder() {
  const { state } = useStudent();
  const rows = useMemo<PortalRow[]>(() => {
    const unis = INSTITUTIONS.flatMap((i) => (RESIDENCE_PAGES[i.id] ? [{ key: i.id, name: i.name, province: i.province, portal: RESIDENCE_PAGES[i.id]!.portal }] : []));
    const others = OTHER_UNIVERSITY_PORTALS.map((o) => ({ key: o.name, name: o.name, province: o.province, portal: o.portal }));
    const tvets = TVET_COLLEGES.map((c) => ({ key: c.id, name: c.name, province: c.province, portal: c.portal }));
    return [...unis, ...others, ...tvets].sort((a, b) => a.name.localeCompare(b.name));
  }, []);
  const [province, setProvince] = useState<string>(state.profile.province);
  const [key, setKey] = useState('');
  const inProvince = rows.filter((r) => r.province === province);
  const selected = inProvince.find((r) => r.key === key) ?? inProvince[0];

  return (
    <section aria-labelledby="portal-finder" className="mt-10">
      <SectionTitle
        id="portal-finder"
        title="Find your NSFAS accommodation portal"
        description="NSFAS uses a different accommodation portal per institution. This is the official list from nsfas.org.za for public universities and TVET colleges."
      />
      <div className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <SelectField
          label="Province"
          value={province}
          onChange={(e) => {
            setProvince(e.target.value);
            setKey('');
          }}
          options={PROVINCES.map((p) => ({ value: p, label: p }))}
        />
        <SelectField
          label="Institution"
          value={selected?.key ?? ''}
          onChange={(e) => setKey(e.target.value)}
          options={inProvince.map((r) => ({ value: r.key, label: r.name }))}
        />
        {selected && (
          <div className="flex flex-col gap-3 rounded-xl bg-paper p-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-sm text-body">
              NSFAS lists <span className="font-semibold text-ink">{NSFAS_PORTALS[selected.portal].host}</span> for {selected.name}. Use it to find NSFAS-accredited places and apply for
              private accommodation.
            </p>
            <a
              href={NSFAS_PORTALS[selected.portal].url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 self-start rounded-full bg-veld-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-veld-700"
            >
              Open portal
              <ExternalLink aria-hidden className="size-3.5 opacity-70" />
              <span className="sr-only">(official NSFAS site, opens in a new tab)</span>
            </a>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-subtle">
        Source:{' '}
        <a href={NSFAS_SOURCES.portalChooser.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
          {NSFAS_SOURCES.portalChooser.label}
        </a>
        .
      </p>
    </section>
  );
}
