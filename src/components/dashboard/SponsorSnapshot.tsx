import { Link } from 'react-router-dom';
import { BadgeCheck, Handshake, Lock } from 'lucide-react';
import type { StudentState } from '../../types';
import { usePlatform } from '../../platform/PlatformProvider';
import { TrustBadge } from '../verification/TrustBadge';
import { fundFit, liveCandidate } from '../../intelligence/marketplace';
import { contactBlockers, sponsorVerified, studentTrust } from '../../utils/trust';
import { formatZAR } from '../../utils/format';
import { timeAgo } from '../../utils/dates';

export function SponsorSnapshot({ state }: { state: StudentState }) {
  const { platform } = usePlatform();
  const me = liveCandidate(state);
  const blockers = contactBlockers(state);
  const open = platform.funds.filter((f) => f.status === 'open' && sponsorVerified(platform.sponsors.find((s) => s.id === f.sponsorId)!));
  const matching = open.filter((f) => fundFit(f, me, platform).eligible);
  const apps = platform.applications.filter((a) => a.studentId === state.id);
  const shared = apps.filter((a) => a.status !== 'declined-by-sponsor').length;
  const offer = apps.find((a) => a.status === 'offered');
  const offerFund = offer ? platform.funds.find((f) => f.id === offer.fundId) : undefined;
  const lastEvent = platform.events.find((e) => e.studentId === state.id && e.audience !== 'sponsor');

  return (
    <section className="card flex flex-col p-5 sm:p-6" aria-labelledby="sp-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="sp-heading" className="flex items-center gap-2 text-lg font-semibold">
          <Handshake aria-hidden className="size-5 text-veld-600" /> Sponsors
        </h2>
        <TrustBadge level={studentTrust(state)} />
      </div>

      {offer ? (
        <Link to="/app/sponsors" className="mt-4 block rounded-2xl bg-ink p-4 text-white hover:bg-ink-800">
          <p className="flex items-center gap-1.5 text-xs text-veld-200">
            <BadgeCheck aria-hidden className="size-3.5" /> Offer waiting for you
          </p>
          <p className="num mt-1 font-display text-2xl font-bold">{formatZAR(offer.amount ?? 0)}</p>
          <p className="text-sm text-white/70">{offerFund?.name}</p>
        </Link>
      ) : (
        <p className="mt-4 font-display text-[2rem] leading-none font-bold text-ink">
          {matching.length}
          <span className="ml-2 font-sans text-sm font-medium text-muted">of {open.length} verified funds match you</span>
        </p>
      )}

      {blockers.length > 0 ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
          Sponsors can’t see you until you {blockers.join(', ').toLowerCase()}.
        </p>
      ) : (
        <p className="mt-3 text-sm text-body">
          {shared === 0 ? 'Not shared yet.' : `Shared with ${shared} ${shared === 1 ? 'sponsor' : 'sponsors'}.`} Awards go straight to your institution.
        </p>
      )}
      {lastEvent && (
        <p className="mt-3 text-xs text-muted">
          Latest: {lastEvent.text} ({timeAgo(lastEvent.at).toLowerCase()})
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
        <Link to="/app/sponsors" className="text-veld-700 hover:underline underline-offset-4">
          {offer ? 'Review offer' : 'See matching funds'}
        </Link>
        <Link to="/app/verify" className="text-veld-700 hover:underline underline-offset-4">
          Verification
        </Link>
      </div>
    </section>
  );
}
