import { useEffect, useId, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, CircleAlert, CircleCheck, Lock, Search, ShieldCheck, Users } from 'lucide-react';
import type { CandidateProfile, DocumentKind, Fund } from '../../types';
import { DOCUMENT_INFO, OFFER_DOCUMENT_OPTIONS } from '../../data/documents';
import { GUARDIAN_DOCS, isMinor } from '../../platform/guardianRules';
import { useSponsor } from '../../hooks/useSponsor';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PageHeader, EmptyState } from '../../components/ui/Misc';
import { Why } from '../../components/ui/Why';
import { Badge, DemoTag } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { MoneyInput } from '../../components/forms/Fields';
import { CheckChips, TrustBadge } from '../../components/verification/TrustBadge';
import { remainingBudget, type RankedCandidate } from '../../intelligence/marketplace';
import { screenMessage } from '../../intelligence/moderation';
import { fieldLabel } from '../../utils/matching';
import { formatZAR, percent } from '../../utils/format';
import { SPONSOR_STATUS_LABEL as STATUS_LABEL } from '../../data/labels';
import { cn } from '../../utils/cn';
import { LIMITS } from '../../platform/authorize';

const PASS_REASONS = ['Field is outside this fund’s focus', 'Gap is larger than one award can cover', 'Not enough verification yet', 'Fund places already allocated', 'Other'];

export default function SponsorCandidatesPage() {
  const { sponsor, verified, funds, brief, platform, dispatchPlatform } = useSponsor();
  const notify = useToast();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const openFunds = funds.filter((f) => f.status === 'open');
  const [fundId, setFundId] = useState(params.get('fund') ?? openFunds[0]?.id ?? '');
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [query, setQuery] = useState('');
  const [offerFor, setOfferFor] = useState<RankedCandidate | null>(null);
  const [passFor, setPassFor] = useState<RankedCandidate | null>(null);
  const focus = params.get('focus');
  useDocumentTitle('Candidates');

  useEffect(() => {
    if (focus) requestAnimationFrame(() => document.getElementById(`cand-${focus}`)?.scrollIntoView({ block: 'center' }));
  }, [focus]);

  const fund = funds.find((f) => f.id === fundId);
  const ranked = useMemo(() => {
    const list = brief?.rankedByFund[fundId] ?? [];
    const q = query.trim().toLowerCase();
    return list.filter(
      (r) =>
        (!eligibleOnly || r.fit.eligible || r.application) &&
        r.application?.status !== 'declined-by-sponsor' &&
        (!q || [r.candidate.firstName, r.candidate.province, fieldLabel(r.candidate.field), r.institutionName].join(' ').toLowerCase().includes(q)),
    );
  }, [brief, fundId, eligibleOnly, query]);

  if (!sponsor || !brief) return null;
  if (funds.length === 0) {
    return (
      <div>
        <PageHeader title="Candidates" />
        <EmptyState icon={<Users aria-hidden className="size-5" />} title="Publish a fund to see matched students" action={<ButtonLink to="/sponsor/funds">Create a fund</ButtonLink>}>
          The assistant ranks verified students against each fund’s criteria.
        </EmptyState>
      </div>
    );
  }

  const prefs = brief.prefs;

  return (
    <div>
      <PageHeader
        title="Candidates"
        description="Verified students ranked for each fund. First names only."
        kicker={<DemoTag>Fictional students</DemoTag>}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-80">
          <label htmlFor="fund-select" className="mb-1.5 block text-sm font-semibold text-ink">
            Fund
          </label>
          <select
            id="fund-select"
            value={fundId}
            onChange={(e) => setFundId(e.target.value)}
            className="h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
          >
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
                {f.status === 'closed' ? ' (closed)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <label htmlFor="cand-search" className="sr-only">
            Search candidates
          </label>
          <input
            id="cand-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, province, field or institution"
            className="h-11 w-full rounded-xl border border-line-strong bg-surface pr-3 pl-10 text-sm focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
          />
        </div>
        <label className="flex h-11 items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} className="size-4 accent-[var(--color-veld-600)]" />
          Eligible only
        </label>
      </div>

      {fund && <FundStrip fund={fund} used={fund.budget - remainingBudget(fund, platform)} />}

      <section className="mt-4 flex items-start gap-3 rounded-2xl border border-veld-100 bg-veld-50/60 p-4" aria-label="How ranking works">
        <Brain aria-hidden className="mt-0.5 size-5 shrink-0 text-veld-700" />
        <div className="text-sm">
          <p className="font-semibold text-ink">
            {prefs.decisions >= 3 ? `Ranking adapts to your last ${prefs.decisions} decisions` : 'Ranking is based on fit until you’ve made a few decisions'}
          </p>
          <Why className="mt-0.5">
            Score = how much of the gap an award closes, the student’s on-time record, verification level and criteria fit
            {prefs.likes.length ? `, adjusted for what you’ve chosen before: ${prefs.likes.map((l) => l.replace(/ \(.*\)$/, '')).join(', ')}.` : '.'}
          </Why>
        </div>
      </section>

      {!verified && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <Lock aria-hidden className="size-4 shrink-0" /> Finish your organisation checks to send offers.{' '}
          <Link to="/sponsor/organisation" className="font-semibold underline">
            Open checks
          </Link>
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {ranked.map((r) => (
          <CandidateRow
            key={r.candidate.id}
            r={r}
            highlighted={focus === r.candidate.id}
            canAct={verified && fund?.status === 'open'}
            onShortlist={() => {
              dispatchPlatform({ type: 'shortlist', fundId, studentId: r.candidate.id, studentName: r.candidate.firstName });
              notify(`${r.candidate.firstName} shortlisted. The assistant will weigh this in future rankings.`);
            }}
            onOffer={() => setOfferFor(r)}
            onPass={() => setPassFor(r)}
          />
        ))}
        {ranked.length === 0 && (
          <EmptyState icon={<Users aria-hidden className="size-5" />} title="No candidates match">
            Turn off “Eligible only” or widen the fund’s criteria.
          </EmptyState>
        )}
      </ul>

      {offerFor && fund && (
        <OfferModal
          r={offerFor}
          fund={fund}
          remaining={remainingBudget(fund, platform)}
          onClose={() => setOfferFor(null)}
          onSend={(amount, note, requiredDocs) => {
            dispatchPlatform({ type: 'sendOffer', fundId, studentId: offerFor.candidate.id, studentName: offerFor.candidate.firstName, amount, note, requiredDocs });
            notify(`Offer of ${formatZAR(amount)} sent to ${offerFor.candidate.firstName}. They’ll see it straight away.`);
            setOfferFor(null);
          }}
        />
      )}
      <PassModal
        r={passFor}
        onClose={() => setPassFor(null)}
        onPass={(reason) => {
          if (!passFor) return;
          dispatchPlatform({ type: 'declineCandidate', fundId, studentId: passFor.candidate.id, reason });
          notify(`Passed on ${passFor.candidate.firstName}. The assistant will learn from this.`, 'info');
          setPassFor(null);
        }}
      />
    </div>
  );
}

function FundStrip({ fund, used }: { fund: Fund; used: number }) {
  const ratio = fund.budget ? used / fund.budget : 0;
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-4 text-sm sm:grid-cols-4">
      <div>
        <p className="text-xs text-muted">Committed</p>
        <p className="num font-semibold text-ink">
          {formatZAR(used)} <span className="font-normal text-muted">({percent(ratio)})</span>
        </p>
      </div>
      <div>
        <p className="text-xs text-muted">Remaining</p>
        <p className="num font-semibold text-ink">{formatZAR(fund.budget - used)}</p>
      </div>
      <div>
        <p className="text-xs text-muted">Max per student</p>
        <p className="num font-semibold text-ink">{formatZAR(fund.maxPerStudent)}</p>
      </div>
      <div>
        <p className="text-xs text-muted">Minimum verification</p>
        <TrustBadge level={fund.minTrust} />
      </div>
    </div>
  );
}

function CandidateRow({
  r,
  highlighted,
  canAct,
  onShortlist,
  onOffer,
  onPass,
}: {
  r: RankedCandidate;
  highlighted: boolean;
  canAct: boolean;
  onShortlist: () => void;
  onOffer: () => void;
  onPass: () => void;
}) {
  const c: CandidateProfile = r.candidate;
  const status = r.application?.status;
  const done = status === 'offered' || status === 'accepted' || status === 'approved' || status === 'paid' || status === 'declined-by-student';
  return (
    <li id={`cand-${c.id}`} className={cn('card scroll-mt-24 p-4 sm:p-5', highlighted && 'ring-3 ring-veld-200', !r.fit.eligible && 'opacity-80')}>
      <div className="grid gap-4 lg:grid-cols-[4.5rem_1fr_15rem] lg:items-start">
        <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-1">
          <span className="num font-display text-3xl font-bold text-ink">{r.score}</span>
          <span className="text-xs text-muted">
            match score
            {r.learnedBoost !== 0 && (
              <span className={cn('ml-1 font-semibold lg:ml-0 lg:block', r.learnedBoost > 0 ? 'text-veld-700' : 'text-clay-600')}>
                {r.learnedBoost > 0 ? '+' : ''}
                {r.learnedBoost} learned
              </span>
            )}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-sans text-lg font-semibold">{c.firstName}</h3>
            {c.isLive && <Badge tone="ink">Live demo student</Badge>}
            {!c.isAdult && (
              <Badge tone="neutral" icon={<ShieldCheck aria-hidden className="size-3.5" />}>
                Under 18, guardian linked
              </Badge>
            )}
            {status && <Badge tone="veld">{STATUS_LABEL[status]}</Badge>}
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {fieldLabel(c.field)}, {c.province}
            {r.institutionName ? `, aiming for ${r.institutionName}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TrustBadge level={c.trust} />
            <CheckChips checks={c.checks} isAdult={c.isAdult} />
          </div>
          <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            {r.fit.reasons.slice(0, 4).map((x) => (
              <li key={x} className="flex gap-1.5 text-body">
                <CircleCheck aria-hidden className="mt-0.5 size-3.5 shrink-0 text-veld-600" />
                {x}
              </li>
            ))}
            {r.fit.blockers.map((x) => (
              <li key={x} className="flex gap-1.5 text-amber-800">
                <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-paper p-4">
          <dl className="grid grid-cols-2 gap-2 text-xs lg:grid-cols-1">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">{r.fit.remainingGap < c.gap ? 'Gap after other bursaries' : 'Funding gap'}</dt>
              <dd className="num font-semibold text-ink">{formatZAR(r.fit.remainingGap)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Suggested award</dt>
              <dd className="num font-semibold text-veld-700">{formatZAR(r.fit.suggestedAmount)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">On-time tasks</dt>
              <dd className="num font-semibold text-ink">{c.onTimeRate != null ? percent(c.onTimeRate) : 'New'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Plan progress</dt>
              <dd className="num font-semibold text-ink">{percent(c.progressRatio)}</dd>
            </div>
          </dl>
          {r.application?.amount != null && <p className="num mt-2 text-xs text-muted">Offered {formatZAR(r.application.amount)}</p>}
          {!done && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={onOffer} disabled={!canAct || !r.fit.eligible}>
                Make offer
              </Button>
              {status !== 'shortlisted' && (
                <Button size="sm" variant="secondary" onClick={onShortlist} disabled={!canAct}>
                  Shortlist
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={onPass}>
                Pass
              </Button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function OfferModal({
  r,
  fund,
  remaining,
  onClose,
  onSend,
}: {
  r: RankedCandidate;
  fund: Fund;
  remaining: number;
  onClose: () => void;
  onSend: (amount: number, note: string, docs: DocumentKind[]) => void;
}) {
  const [amount, setAmount] = useState(r.fit.suggestedAmount);
  const [docs, setDocs] = useState<DocumentKind[]>(['admission-letter', 'latest-results']);
  const [note, setNote] = useState(`Hi ${r.candidate.firstName}, we’d like to support your studies. The award is paid straight to your institution.`);
  const [error, setError] = useState<string | null>(null);
  const amountId = useId();
  const noteId = useId();
  const screen = note.trim() ? screenMessage(note, 'sponsor') : null;
  const gap = r.fit.remainingGap;
  const cover = gap > 0 ? Math.min(1, amount / gap) : 0;

  const send = () => {
    if (amount <= 0) return setError('Enter an amount greater than R0.');
    if (amount > fund.maxPerStudent) return setError(`This fund’s maximum per student is ${formatZAR(fund.maxPerStudent)}.`);
    if (amount > remaining) return setError(`Only ${formatZAR(remaining)} is left in this fund.`);
    if (amount > gap) return setError(`${r.candidate.firstName} has ${formatZAR(gap)} left to fund after other bursaries. Offer that or less.`);
    if (screen?.blocked) return setError('Your message asks for payment or bank details. Offers can’t include that.');
    onSend(amount, note, docs);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Offer to ${r.candidate.firstName}`}
      description={`${fund.name}. Paid to the institution after the student signs and you approve their documents.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={send}>Send offer</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor={amountId} className="mb-1.5 block text-sm font-semibold text-ink">
            Award amount
          </label>
          <MoneyInput id={amountId} value={amount} onChange={(v) => { setAmount(v); setError(null); }} invalid={Boolean(error)} />
          <p className="mt-1.5 text-xs text-muted">
            Covers {percent(cover)} of {r.candidate.firstName}’s {formatZAR(gap)} gap. Suggested: {formatZAR(r.fit.suggestedAmount)}.
          </p>
        </div>
        <div>
          <label htmlFor={noteId} className="mb-1.5 block text-sm font-semibold text-ink">
            Message
          </label>
          <textarea maxLength={LIMITS.note}
            id={noteId}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
          />
          {screen && screen.flags.length > 0 && (
            <p className={cn('mt-1.5 text-xs font-medium', screen.blocked ? 'text-clay-600' : 'text-amber-700')}>
              {screen.blocked ? 'Payment requests are blocked and suspend the account.' : `${screen.flags.map((f) => f.label).join(', ')} will be removed.`}
            </p>
          )}
          {!r.candidate.isAdult && <p className="mt-1.5 text-xs text-muted">{r.candidate.firstName} is under 18. Their guardian can read this message.</p>}
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-ink">Documents needed before payment</legend>
          <p className="mb-2 text-xs text-muted">Requested and shared inside the app after the student signs. Nothing is sent by email.</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {OFFER_DOCUMENT_OPTIONS.map((k) => {
              const locked = k === 'admission-letter';
              const on = docs.includes(k);
              return (
                <label key={k} className={cn('flex items-start gap-2 rounded-xl border p-3 text-sm', on ? 'border-veld-500 bg-veld-50/60' : 'border-line-strong')}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={locked}
                    onChange={() => setDocs((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]))}
                    className="mt-0.5 size-4 accent-[var(--color-veld-600)]"
                  />
                  <span>
                    <span className="block font-semibold text-ink">{DOCUMENT_INFO[k].label}</span>
                    {locked && <span className="block text-xs text-muted">Always required</span>}
                  </span>
                </label>
              );
            })}
            {isMinor(r.candidate) &&
              GUARDIAN_DOCS.map((k) => (
                <label key={k} className="flex items-start gap-2 rounded-xl border border-veld-500 bg-veld-50/60 p-3 text-sm">
                  <input type="checkbox" checked disabled className="mt-0.5 size-4 accent-[var(--color-veld-600)]" />
                  <span>
                    <span className="block font-semibold text-ink">{DOCUMENT_INFO[k].label}</span>
                    <span className="block text-xs text-muted">Required for under-18s</span>
                  </span>
                </label>
              ))}
          </div>
          {isMinor(r.candidate) && (
            <p className="mt-2 text-xs text-muted">
              {r.candidate.firstName} is under 18, so a parent or guardian must consent and co-sign. The law requires this for a child’s information and for a bursary agreement.
            </p>
          )}
        </fieldset>
        {error && (
          <p role="alert" className="rounded-xl bg-clay-50 p-3 text-sm text-clay-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function PassModal({ r, onClose, onPass }: { r: RankedCandidate | null; onClose: () => void; onPass: (reason: string) => void }) {
  const [reason, setReason] = useState(PASS_REASONS[0]);
  return (
    <Modal
      open={Boolean(r)}
      onClose={onClose}
      title={`Pass on ${r?.candidate.firstName ?? ''}?`}
      description="The student isn’t told why. Your reason helps the assistant rank future candidates."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="dark" onClick={() => onPass(reason)}>
            Pass
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Reason</legend>
        <div className="space-y-1.5">
          {PASS_REASONS.map((x) => (
            <label key={x} className="flex items-center gap-2 text-sm">
              <input type="radio" name="pass-reason" checked={reason === x} onChange={() => setReason(x)} className="size-4 accent-[var(--color-veld-600)]" />
              {x}
            </label>
          ))}
        </div>
      </fieldset>
    </Modal>
  );
}
