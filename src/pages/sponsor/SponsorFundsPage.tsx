import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CirclePlus, HandCoins, Lock } from 'lucide-react';
import type { Fund, IncomeBand, Province, StudyField, TrustLevel } from '../../types';
import { useSponsor } from '../../hooks/useSponsor';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PageHeader, EmptyState } from '../../components/ui/Misc';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ChipGroup, MoneyInput, TextField } from '../../components/forms/Fields';
import { ProgressBar } from '../../components/ui/Progress';
import { TrustBadge } from '../../components/verification/TrustBadge';
import { committed, forecastFund } from '../../intelligence/marketplace';
import { FIELDS, INCOME_BANDS, PROVINCES } from '../../data/labels';
import { TRUST_LABEL } from '../../utils/trust';
import { formatZAR, percent } from '../../utils/format';
import { addDays, formatDate, todayISO } from '../../utils/dates';
import { fieldLabel } from '../../utils/matching';
import { makeId } from '../../utils/createState';
import { LIMITS } from '../../platform/authorize';

export default function SponsorFundsPage() {
  const { sponsor, verified, funds, platform, dispatchPlatform, brief } = useSponsor();
  const notify = useToast();
  const [editing, setEditing] = useState<Fund | 'new' | null>(null);
  useDocumentTitle('Funds');
  if (!sponsor || !brief) return null;

  return (
    <div>
      <PageHeader
        title="Funds"
        description="Each fund sets who you want to support. The assistant matches verified students to it and forecasts how fast it will be used."
        actions={
          <Button icon={<CirclePlus aria-hidden className="size-4" />} onClick={() => setEditing('new')} disabled={!verified}>
            New fund
          </Button>
        }
      />
      {!verified && (
        <p className="mb-5 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <Lock aria-hidden className="size-4 shrink-0" /> Funds can be published once your organisation checks are complete.{' '}
          <Link to="/sponsor/organisation" className="font-semibold underline">
            Open checks
          </Link>
        </p>
      )}
      {funds.length === 0 ? (
        <EmptyState icon={<HandCoins aria-hidden className="size-5" />} title="No funds yet" action={verified ? <Button onClick={() => setEditing('new')}>Create your first fund</Button> : undefined}>
          Set a budget, the fields and provinces you want to support, and the verification level you require.
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {funds.map((f) => {
            const used = committed(f, platform);
            const fc = forecastFund(f, platform, brief.rankedByFund[f.id] ?? []);
            return (
              <article key={f.id} className="card flex flex-col p-5 sm:p-6" aria-labelledby={`f-${f.id}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={f.status === 'open' ? 'veld' : 'outline'}>{f.status === 'open' ? `Open until ${formatDate(f.closesOn)}` : 'Closed'}</Badge>
                  <TrustBadge level={f.minTrust} />
                </div>
                <h2 id={`f-${f.id}`} className="mt-3 text-xl font-semibold">
                  {f.name}
                </h2>
                <p className="mt-1 text-sm text-body">{f.description}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="num font-semibold text-ink">{formatZAR(used)} committed</span>
                    <span className="num text-muted">of {formatZAR(f.budget)}</span>
                  </div>
                  <ProgressBar value={f.budget ? used / f.budget : 0} label={`${percent(f.budget ? used / f.budget : 0)} of budget committed`} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                  <Item k="Places left" v={`${fc.placesLeft} of ${f.places}`} />
                  <Item k="Max per student" v={formatZAR(f.maxPerStudent)} />
                  <Item k="Eligible, not reviewed" v={String(fc.eligibleWaiting)} />
                  <Item k="Fields" v={f.fields === 'all' ? 'All' : f.fields.map(fieldLabel).join(', ')} />
                  <Item k="Provinces" v={f.provinces === 'all' ? 'All' : f.provinces.join(', ')} />
                  <Item k="Income" v={f.incomeBands === 'all' ? 'Any' : `${f.incomeBands.length} bands`} />
                </dl>
                <p className="mt-4 rounded-xl bg-paper p-3 text-sm text-body">
                  <strong className="font-semibold text-ink">Forecast: </strong>
                  {fc.headline}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Link to={`/sponsor/candidates?fund=${f.id}`} className="inline-flex h-9 items-center rounded-full bg-veld-600 px-4 text-sm font-semibold text-white hover:bg-veld-700">
                    View candidates
                  </Link>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(f)} disabled={!verified}>
                    Edit
                  </Button>
                  {f.status === 'open' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        dispatchPlatform({ type: 'closeFund', fundId: f.id });
                        notify(`${f.name} closed to new matches.`, 'info');
                      }}
                    >
                      Close fund
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {editing && (
        <FundForm
          fund={editing === 'new' ? null : editing}
          sponsorId={sponsor.id}
          onClose={() => setEditing(null)}
          onSave={(fund) => {
            dispatchPlatform({ type: 'saveFund', fund });
            notify(editing === 'new' ? `${fund.name} published. Matching students are being notified.` : `${fund.name} updated.`);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink">{v}</dd>
    </div>
  );
}

function FundForm({ fund, sponsorId, onClose, onSave }: { fund: Fund | null; sponsorId: string; onClose: () => void; onSave: (f: Fund) => void }) {
  const [name, setName] = useState(fund?.name ?? '');
  const [description, setDescription] = useState(fund?.description ?? '');
  const [budget, setBudget] = useState(fund?.budget ?? 300000);
  const [maxPer, setMaxPer] = useState(fund?.maxPerStudent ?? 40000);
  const [places, setPlaces] = useState(String(fund?.places ?? 8));
  const [fields, setFields] = useState<StudyField[]>(fund?.fields === 'all' || !fund ? [] : fund.fields);
  const [provinces, setProvinces] = useState<Province[]>(fund?.provinces === 'all' || !fund ? [] : fund.provinces);
  const [income, setIncome] = useState<IncomeBand[]>(fund?.incomeBands === 'all' || !fund ? [] : fund.incomeBands);
  const [minTrust, setMinTrust] = useState<TrustLevel>(fund?.minTrust ?? 1);
  const [closesIn, setClosesIn] = useState('30');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const descId = useId();
  const ids = { budget: useId(), max: useId(), places: useId(), trust: useId(), closes: useId() };

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (name.trim().length < 4) err.name = 'Give the fund a name of at least 4 characters.';
    if (budget < 10000) err.budget = 'Budget must be at least R10,000.';
    if (maxPer <= 0) err.max = 'Enter a maximum award.';
    else if (maxPer > budget) err.max = 'Maximum award can’t be more than the budget.';
    const p = Number(places);
    if (!Number.isInteger(p) || p < 1 || p > 500) err.places = 'Enter between 1 and 500 places.';
    const days = Number(closesIn);
    if (!fund && (!Number.isInteger(days) || days < 7 || days > 365)) err.closes = 'Choose between 7 and 365 days.';
    setErrors(err);
    if (Object.keys(err).length) return;
    onSave({
      id: fund?.id ?? makeId('fund'),
      sponsorId,
      name: name.trim(),
      description: description.trim() || 'No description yet.',
      budget,
      maxPerStudent: maxPer,
      places: p,
      fields: fields.length ? fields : 'all',
      provinces: provinces.length ? provinces : 'all',
      incomeBands: income.length ? income : 'all',
      minTrust,
      closesOn: fund?.closesOn ?? addDays(todayISO(), days),
      status: fund?.status ?? 'open',
      createdAt: fund?.createdAt ?? new Date().toISOString(),
    });
  };

  const inputCls = 'h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-[0.9375rem] focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none';

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={fund ? `Edit ${fund.name}` : 'New fund'}
      description="Leave a criteria group empty to accept everyone."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="fund-form">
            {fund ? 'Save changes' : 'Publish fund'}
          </Button>
        </>
      }
    >
      <form id="fund-form" onSubmit={submit} noValidate className="space-y-5">
        <TextField label="Fund name" maxLength={LIMITS.name} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder="e.g. Women in Engineering Bursary" />
        <div>
          <label htmlFor={descId} className="mb-1.5 block text-sm font-semibold text-ink">
            What it covers <span className="font-normal text-subtle">Optional</span>
          </label>
          <textarea maxLength={LIMITS.about} id={descId} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Money id={ids.budget} label="Total budget" value={budget} onChange={setBudget} error={errors.budget} />
          <Money id={ids.max} label="Max per student" value={maxPer} onChange={setMaxPer} error={errors.max} />
          <div>
            <label htmlFor={ids.places} className="mb-1.5 block text-sm font-semibold text-ink">
              Places
            </label>
            <input id={ids.places} inputMode="numeric" value={places} onChange={(e) => setPlaces(e.target.value.replace(/\D/g, ''))} className={inputCls} aria-invalid={errors.places ? true : undefined} />
            {errors.places && <p className="mt-1.5 text-xs font-medium text-clay-600">{errors.places}</p>}
          </div>
        </div>
        <ChipGroup legend="Fields" description="Empty means all fields." options={FIELDS} selected={fields} multiple onToggle={(v) => setFields((l) => toggle(l, v))} />
        <ChipGroup legend="Provinces" description="Empty means all provinces." options={PROVINCES.map((p) => ({ value: p, label: p }))} selected={provinces} multiple onToggle={(v) => setProvinces((l) => toggle(l, v))} />
        <ChipGroup legend="Household income" description="Empty means any income." options={INCOME_BANDS.filter((b) => b.value !== 'prefer-not')} selected={income} multiple onToggle={(v) => setIncome((l) => toggle(l, v))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.trust} className="mb-1.5 block text-sm font-semibold text-ink">
              Minimum verification
            </label>
            <select id={ids.trust} value={minTrust} onChange={(e) => setMinTrust(Number(e.target.value) as TrustLevel)} className={inputCls}>
              {([1, 2, 3] as TrustLevel[]).map((t) => (
                <option key={t} value={t}>
                  {TRUST_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          {!fund && (
            <div>
              <label htmlFor={ids.closes} className="mb-1.5 block text-sm font-semibold text-ink">
                Closes in (days)
              </label>
              <input id={ids.closes} inputMode="numeric" value={closesIn} onChange={(e) => setClosesIn(e.target.value.replace(/\D/g, ''))} className={inputCls} aria-invalid={errors.closes ? true : undefined} />
              {errors.closes && <p className="mt-1.5 text-xs font-medium text-clay-600">{errors.closes}</p>}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

function Money({ id, label, value, onChange, error }: { id: string; label: string; value: number; onChange: (n: number) => void; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <MoneyInput id={id} value={value} onChange={onChange} invalid={Boolean(error)} />
      {error && <p className="mt-1.5 text-xs font-medium text-clay-600">{error}</p>}
    </div>
  );
}
