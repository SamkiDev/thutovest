import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BadgeCheck, Building, FlaskConical, HandCoins, LayoutDashboard, LogOut, Menu, MessagesSquare, Receipt, ShieldAlert, Users, X } from 'lucide-react';
import { Logo } from './Logo';
import { useSponsor } from '../../hooks/useSponsor';
import { usePlatform } from '../../platform/PlatformProvider';
import { useLiveToasts } from '../../hooks/useLiveToasts';
import { cn } from '../../utils/cn';

const NAV = [
  { to: '/sponsor', label: 'Overview', short: 'Overview', icon: LayoutDashboard, end: true, mobile: true },
  { to: '/sponsor/candidates', label: 'Candidates', short: 'Candidates', icon: Users, mobile: true },
  { to: '/sponsor/funds', label: 'Funds', short: 'Funds', icon: HandCoins, mobile: true },
  { to: '/sponsor/pipeline', label: 'Offers & payments', short: 'Payments', icon: Receipt, mobile: true },
  { to: '/sponsor/messages', label: 'Messages', short: 'Messages', icon: MessagesSquare, mobile: true },
  { to: '/sponsor/organisation', label: 'Organisation & checks', short: 'Org', icon: Building, mobile: false },
];

export function SponsorShell() {
  const { sponsor, verified, applications } = useSponsor();
  const { session, signOut } = usePlatform();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useLiveToasts((e) => (e.audience === 'sponsor' || e.audience === 'all') && e.sponsorId === sponsor?.id);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  if (!session || session.role !== 'sponsor' || !sponsor) return <Navigate to="/signin?role=sponsor" replace />;

  const waiting = applications.filter((a) => a.status === 'interested' || a.status === 'accepted' || a.status === 'approved').length;

  const nav = (
    <ul className="space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              cn('flex items-center gap-3 rounded-xl px-3 py-3 text-[0.9375rem] font-medium transition-colors', isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white')
            }
          >
            <Icon aria-hidden className="size-[18px] shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/sponsor/pipeline' && waiting > 0 && (
              <span className="num rounded-full bg-amber-400 px-1.5 py-px text-[0.6875rem] font-bold text-ink" aria-label={`${waiting} need action`}>
                {waiting}
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  const orgCard = (
    <Link to="/sponsor/organisation" className="mb-6 block rounded-2xl bg-white/5 p-4 hover:bg-white/10">
      <p className="text-xs text-white/55">Sponsor account</p>
      <p className="mt-0.5 truncate font-semibold text-white">{sponsor.name}</p>
      <p className={cn('mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold', verified ? 'text-veld-300' : 'text-amber-400')}>
        {verified ? <BadgeCheck aria-hidden className="size-3.5" /> : <ShieldAlert aria-hidden className="size-3.5" />}
        {sponsor.status === 'suspended' ? 'Suspended' : verified ? 'Verified sponsor' : 'Verification incomplete'}
      </p>
    </Link>
  );

  const footer = (
    <div className="mt-auto space-y-2 rounded-2xl border border-white/10 p-4 text-xs text-white/60">
      <p className="flex items-center gap-1.5 font-semibold text-white/80">
        <FlaskConical aria-hidden className="size-3.5" /> Prototype
      </p>
      <p>Students, funds and payments are demonstration data. Payments are simulated.</p>
      <button
        type="button"
        onClick={() => {
          signOut();
          navigate('/');
        }}
        className="inline-flex items-center gap-1.5 font-semibold text-veld-300 hover:text-white"
      >
        <LogOut aria-hidden className="size-3.5" /> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-[17rem]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col bg-ink-900 px-4 py-5 text-white lg:flex" aria-label="Main">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2" aria-label="Home">
          <Logo dark />
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-white/80">Sponsors</span>
        </Link>
        {orgCard}
        <nav aria-label="Sponsor sections">{nav}</nav>
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-15 items-center justify-between border-b border-line bg-paper px-4 lg:hidden">
        <Link to="/" aria-label="Home" className="flex items-center gap-2">
          <Logo />
          <span className="rounded-md bg-ink px-1.5 py-0.5 text-[0.6875rem] font-semibold text-white">Sponsors</span>
        </Link>
        <button type="button" onClick={() => setMenuOpen(true)} className="grid size-11 place-items-center rounded-full hover:bg-sunken" aria-label="Open menu" aria-expanded={menuOpen}>
          <Menu aria-hidden className="size-6 text-ink" />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="rise absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col bg-ink-900 p-4 text-white">
            <div className="mb-6 flex items-center justify-between">
              <Logo dark />
              <button type="button" onClick={() => setMenuOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close menu" autoFocus>
                <X aria-hidden className="size-6" />
              </button>
            </div>
            {orgCard}
            <nav aria-label="Sponsor sections">{nav}</nav>
            {footer}
          </div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="mx-auto max-w-[76rem] px-4 pt-6 pb-28 outline-none sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
        {sponsor.status === 'suspended' && (
          <p className="mb-6 flex items-start gap-2 rounded-2xl bg-clay-50 p-4 text-sm text-clay-700" role="alert">
            <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" /> {sponsor.suspendedReason}
          </p>
        )}
        <Outlet />
      </main>

      <nav aria-label="Quick sections" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="grid grid-cols-5">
          {NAV.filter((n) => n.mobile).map(({ to, short, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold', isActive ? 'text-veld-700' : 'text-muted')}>
                {({ isActive }) => (
                  <>
                    {isActive && <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-b-full bg-veld-500" />}
                    <Icon aria-hidden className="size-[22px]" />
                    {short}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
