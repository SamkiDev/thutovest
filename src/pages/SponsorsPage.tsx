import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BadgeCheck, Building, CircleCheck, Handshake, Inbox, Landmark, Lock, ShieldAlert } from 'lucide-react';
import type { FundApplication, FundingAgreement } from '../types';
import { SignAgreementModal } from '../components/documents/SignAgreementModal';
import { FundingTimeline } from '../components/documents/FundingTimeline';
import { ShareStatusPill } from '../components/documents/DocumentParts';
import { DOCUMENT_INFO } from '../data/documents';
import { APPLICATION_STATUS_LABEL as STATUS_LABEL } from '../data/labels';
import { useStudent } from '../hooks/useStudent';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePlatform } from '../platform/PlatformProvider';
import { PageHeader, EmptyState } from '../components/ui/Misc';
import { Button, ButtonLink } from '../components/ui/Button';
import { Badge, DemoTag } from '../components/ui/Badge';
import { MessageThread } from '../components/marketplace/MessageThread';
import { fundFit, liveCandidate } from '../intelligence/marketplace';
import { SAFETY_RULES } from '../intelligence/moderation';
import { contactBlockers, sponsorVerified, TRUST_LABEL } from '../utils/trust';
import { formatZAR } from '../utils/format';
import { formatDate } from '../utils/dates';
import { institutionById } from '../data/institutions';
import { cn } from '../utils/cn';


export default function SponsorsPage() {
  const { state, engine, dispatch } = useStudent();
  const { platform, dispatchPlatform } = usePlatform();
  const notify = useToast();
  const location = useLocation();
  useDocumentTitle('Sponsors');

  const me = liveCandidate(state);
  const blockers = contactBlockers(state);
  const myApps = platform.applications.filter((a) => a.studentId === state.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const offers = myApps.filter((a) => a.status === 'offered');
  const [thread, setThread] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<FundApplication | null>(null);

  useEffect(() => {
    if (location.hash === '#messages') requestAnimationFrame(() => document.getElementById('messages')?.scrollIntoView({ block: 'start' }));
  }, [location.hash]);

  const fundsRanked = useMemo(
    () =>
      platform.funds
        .filter((f) => f.status === 'open')
        .map((f) => ({ fund: f, fit: fundFit(f, me, platform), sponsor: platform.sponsors.find((s) => s.id === f.sponsorId)! }))
        .filter((x) => x.sponsor && sponsorVerified(x.sponsor))
        .sort((a, b) => Number(b.fit.eligible) - Number(a.fit.eligible) || b.fit.suggestedAmount - a.fit.suggestedAmount),
    [platform, me],
  );

  const lookup = (app: FundApplication) => {
    const fund = platform.funds.find((f) => f.id === app.fundId);
    const sponsor = platform.sponsors.find((s) => s.id === fund?.sponsorId);
    return { fund, sponsor };
  };

  const institution = institutionById(me.institutionId ?? '')?.name ?? 'your institution';

  const accept = (app: FundApplication, agreement: FundingAgreement) => {
    const { sponsor, fund } = lookup(app);
    dispatchPlatform({ type: 'respondOffer', applicationId: app.id, accept: true, studentName: state.profile.firstName, agreement });
    dispatch({ type: 'addSponsorAward', applicationId: app.id, label: `${sponsor?.name}, ${fund?.name}`, amount: app.amount ?? 0 });
    setConfirm(null);
    notify(`Signed. ${formatZAR(app.amount ?? 0)} is reserved for you. Share the requested documents so ${sponsor?.name} can release payment to ${institution}.`);
  };
  const awards = myApps.filter((a) => a.status === 'accepted' || a.status === 'approved' || a.status === 'paid');

  const activeId = thread ?? myApps[0]?.id ?? null;
  const active = myApps.find((a) => a.id === activeId);
  const activeInfo = active ? lookup(active) : null;

  return (
    <div>
      <PageHeader
        title="Sponsors"
        description="Verified sponsors. Money goes to your institution, never to you."
        kicker={<DemoTag>Demo records</DemoTag>}
      />

      {blockers.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-amber-800">
            <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
            Sponsors can’t see you yet: {blockers.join(', ').toLowerCase()}.
          </p>
          <ButtonLink to="/app/verify" size="sm" variant="dark">
            Open verification
          </ButtonLink>
        </div>
      )}

      {offers.length > 0 && (
        <section className="mb-8" aria-labelledby="offers-heading">
          <h2 id="offers-heading" className="mb-3 text-lg font-semibold">
            Offers waiting for you
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {offers.map((app) => {
              const { fund, sponsor } = lookup(app);
              const cover = engine.funding.gap > 0 ? Math.min(1, (app.amount ?? 0) / engine.funding.gap) : 1;
              return (
                <article key={app.id} className="relative overflow-hidden rounded-[var(--radius-card)] bg-ink p-5 text-white sm:p-6">
                  <p className="flex items-center gap-1.5 text-sm text-veld-200">
                    <BadgeCheck aria-hidden className="size-4" /> {sponsor?.name}, verified sponsor
                  </p>
                  <p className="num mt-3 font-display text-4xl font-bold">{formatZAR(app.amount ?? 0)}</p>
                  <p className="mt-1 text-sm text-white/70">{fund?.name}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15" role="img" aria-label={`Covers ${Math.round(cover * 100)}% of your estimated gap`}>
                    <div className="h-full rounded-full bg-veld-300" style={{ width: `${cover * 100}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-white/80">
                    Covers {Math.round(cover * 100)}% of your {formatZAR(engine.funding.gap)} gap. Paid to {institution}.
                  </p>
                  <p className="mt-2 text-xs text-white/65">
                    Documents to share in the app before payment:{' '}
                    {platform.documents
                      .filter((d) => d.applicationId === app.id && d.required)
                      .map((d) => DOCUMENT_INFO[d.kind].label.toLowerCase())
                      .join(', ')}
                    .
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button variant="light" onClick={() => setConfirm(app)}>
                      Review, sign and accept
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/10"
                      onClick={() => {
                        dispatchPlatform({ type: 'respondOffer', applicationId: app.id, accept: false, studentName: state.profile.firstName });
                        notify('Offer declined. The sponsor has been told.', 'info');
                      }}
                    >
                      Decline
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {awards.length > 0 && (
        <section className="mb-8" aria-labelledby="awards-heading">
          <h2 id="awards-heading" className="mb-3 text-lg font-semibold">
            Your awards
          </h2>
          <div className="space-y-4">
            {awards.map((app) => {
              const { fund, sponsor } = lookup(app);
              const shares = platform.documents.filter((d) => d.applicationId === app.id);
              return (
                <article key={app.id} className="card p-5 sm:p-6" aria-label={`${sponsor?.name} award`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-sm text-muted">
                        <BadgeCheck aria-hidden className="size-4 text-veld-600" /> {sponsor?.name}
                      </p>
                      <p className="num font-display text-2xl font-bold text-ink">{formatZAR(app.amount ?? 0)}</p>
                      <p className="text-sm text-muted">{fund?.name}</p>
                    </div>
                    <Badge tone={app.status === 'paid' ? 'veld' : app.status === 'approved' ? 'ink' : 'amber'}>{STATUS_LABEL[app.status]}</Badge>
                  </div>
                  <FundingTimeline app={app} shares={shares} className="mt-5" />
                  <ul className="mt-5 divide-y divide-line rounded-xl border border-line">
                    {shares.map((d) => (
                      <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <span className="min-w-0 text-sm">
                          <span className="font-semibold text-ink">{DOCUMENT_INFO[d.kind].label}</span>
                          {d.reviewNote && d.status === 'resubmit' && <span className="block text-xs text-clay-700">“{d.reviewNote}”</span>}
                          {(d.status === 'requested' || d.status === 'resubmit') && <span className="block text-xs text-muted">Due {formatDate(d.dueOn)}</span>}
                        </span>
                        <span className="flex items-center gap-2">
                          <ShareStatusPill status={d.status} />
                          {(d.status === 'requested' || d.status === 'resubmit') && (
                            <Link
                              to={`/app/documents?upload=${d.kind}&share=${d.id}`}
                              className="inline-flex h-8 items-center rounded-full bg-veld-600 px-3 text-xs font-semibold text-white hover:bg-veld-700"
                            >
                              {state.documents.some((v) => v.kind === d.kind) && d.status === 'requested' ? 'Share' : 'Upload'}
                            </Link>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {app.status === 'paid' && app.paymentReference && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-veld-700">
                      <Landmark aria-hidden className="size-4" /> Paid to {institution}. Reference {app.paymentReference}.
                    </p>
                  )}
                  {app.agreement && (
                    <p className="mt-3 text-xs text-muted">
                      Agreement signed in the app on {formatDate(app.agreement.signedAt.slice(0, 10))}
                      {app.agreement.guardianName ? `, co-signed by ${app.agreement.guardianName}` : ''}.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="funds-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="funds-heading" className="text-lg font-semibold">
              Funds you can apply to
            </h2>
            <p className="text-sm text-muted">Ranked by how well you fit each fund’s criteria. Sharing sends your anonymised profile only.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fundsRanked.map(({ fund, fit, sponsor }) => {
            const app = myApps.find((a) => a.fundId === fund.id);
            return (
              <article key={fund.id} className="card flex flex-col p-5" aria-labelledby={`fund-${fund.id}`}>
                <div className="flex flex-wrap items-center gap-1.5">
                  {fit.eligible ? <Badge tone="veld">You match</Badge> : fit.trustShort && fit.blockers.length === 1 ? <Badge tone="amber">Verify to unlock</Badge> : <Badge tone="outline">Not a match</Badge>}
                  <Badge tone="neutral" icon={<BadgeCheck aria-hidden className="size-3.5" />}>
                    Verified sponsor
                  </Badge>
                </div>
                <h3 id={`fund-${fund.id}`} className="mt-3 text-lg font-semibold">
                  {fund.name}
                </h3>
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <Building aria-hidden className="size-3.5" /> {sponsor.name}
                </p>
                <p className="mt-2 text-sm text-body">{fund.description}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-paper p-3 text-xs">
                  <div>
                    <dt className="text-muted">Up to</dt>
                    <dd className="num text-sm font-semibold text-ink">{formatZAR(fund.maxPerStudent)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Closes</dt>
                    <dd className="text-sm font-semibold text-ink">{formatDate(fund.closesOn)}</dd>
                  </div>
                </dl>
                <ul className="mt-3 flex-1 space-y-1 text-sm">
                  {fit.reasons.slice(0, 3).map((r) => (
                    <li key={r} className="flex gap-1.5 text-body">
                      <CircleCheck aria-hidden className="mt-0.5 size-3.5 shrink-0 text-veld-600" />
                      {r}
                    </li>
                  ))}
                  {fit.blockers.slice(0, 2).map((b) => (
                    <li key={b} className="flex gap-1.5 text-amber-800">
                      <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-line pt-3">
                  {app ? (
                    <p className="text-sm font-semibold text-veld-700">{STATUS_LABEL[app.status]}</p>
                  ) : fit.eligible ? (
                    <Button
                      size="sm"
                      disabled={blockers.length > 0}
                      onClick={() => {
                        dispatchPlatform({ type: 'expressInterest', fundId: fund.id, studentId: state.id, studentName: state.profile.firstName, by: 'student' });
                        dispatch({ type: 'log', text: `Shared your verified profile with ${sponsor.name}`, kind: 'funding' });
                        notify(`Profile shared with ${sponsor.name}.`);
                      }}
                    >
                      Share my profile
                    </Button>
                  ) : fit.trustShort && fit.blockers.length === 1 ? (
                    <Link to="/app/verify" className="text-sm font-semibold text-veld-700 hover:underline">
                      Verify to reach “{TRUST_LABEL[fund.minTrust]}”
                    </Link>
                  ) : (
                    <p className="text-sm text-muted">Doesn’t match your profile</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="messages" tabIndex={-1} className="mt-10 scroll-mt-20 outline-none" aria-labelledby="msg-heading">
        <h2 id="msg-heading" className="mb-3 text-lg font-semibold">
          Applications and messages
        </h2>
        {myApps.length === 0 ? (
          <EmptyState icon={<Inbox aria-hidden className="size-5" />} title="No sponsor conversations yet">
            Share your profile with a fund above. Sponsors reply here, inside the app.
          </EmptyState>
        ) : (
          <div className="card grid overflow-hidden md:grid-cols-[17rem_1fr]">
            <ul className="divide-y divide-line border-b border-line md:border-r md:border-b-0" aria-label="Conversations">
              {myApps.map((a) => {
                const { fund, sponsor } = lookup(a);
                const blocked = platform.messages.some((m) => m.applicationId === a.id && m.blocked);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setThread(a.id)}
                      aria-current={activeId === a.id}
                      className={cn('flex w-full items-start gap-3 px-4 py-3 text-left', activeId === a.id ? 'bg-veld-50/70' : 'hover:bg-paper')}
                    >
                      <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-full', blocked ? 'bg-clay-50 text-clay-600' : 'bg-sunken text-ink')}>
                        {blocked ? <ShieldAlert aria-hidden className="size-4" /> : <Handshake aria-hidden className="size-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{sponsor?.name}</span>
                        <span className="block truncate text-xs text-muted">{fund?.name}</span>
                        <span className={cn('mt-0.5 block text-xs font-medium', blocked ? 'text-clay-600' : 'text-veld-700')}>
                          {blocked ? 'Scam blocked' : STATUS_LABEL[a.status]}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {active && activeInfo && (
              <MessageThread
                messages={platform.messages.filter((m) => m.applicationId === active.id)}
                viewer="student"
                counterpart={activeInfo.sponsor?.name ?? 'sponsor'}
                guardianNote={
                  !state.profile.isAdult && state.verification.guardianName
                    ? `${state.verification.guardianName} (your ${state.verification.guardianRelationship?.toLowerCase()}) can see this conversation.`
                    : undefined
                }
                disabledReason={
                  activeInfo.sponsor?.status !== 'active'
                    ? 'This sponsor is suspended. You can’t reply, and you don’t need to.'
                    : active.status === 'declined-by-sponsor'
                      ? 'This application is closed.'
                      : undefined
                }
                onSend={(text) => dispatchPlatform({ type: 'sendMessage', applicationId: active.id, from: 'student', text })}
              />
            )}
          </div>
        )}
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <h3 className="flex items-center gap-2 font-sans text-sm font-semibold">
            <Landmark aria-hidden className="size-4 text-veld-600" /> How we keep you safe
          </h3>
          <ul className="mt-2 grid gap-1.5 text-sm text-body sm:grid-cols-2">
            {SAFETY_RULES.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </div>
      </section>

      {confirm && (
        <SignAgreementModal
          app={confirm}
          sponsorName={lookup(confirm).sponsor?.name ?? 'Sponsor'}
          fundName={lookup(confirm).fund?.name ?? ''}
          institution={institution}
          requiredDocs={platform.documents.filter((d) => d.applicationId === confirm.id && d.required).map((d) => d.kind)}
          firstName={state.profile.firstName}
          isAdult={state.profile.isAdult}
          guardianName={state.verification.guardianName}
          onClose={() => setConfirm(null)}
          onSign={(agreement) => accept(confirm, agreement)}
        />
      )}
    </div>
  );
}
