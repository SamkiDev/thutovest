import { useEffect, useMemo, useState } from 'react';
import { BRAND } from '../../config/brand';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BedDouble,
  MessageCircle,
  ChartLine,
  School,
  FolderLock,
  Compass,
  FlaskConical,
  Handshake,
  LogOut,
  ShieldCheck,
  HandCoins,
  House,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Radar,
  RotateCcw,
  Route,
  UserRound,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import { useStudentContext } from '../../hooks/useStudent';
import { ProgressBar } from '../ui/Progress';
import { Modal } from '../ui/Modal';
import { Button, ButtonLink } from '../ui/Button';
import { EDUCATION_STAGES } from '../../data/labels';
import { cn } from '../../utils/cn';
import { percent } from '../../utils/format';
import { usePlatform } from '../../platform/PlatformProvider';
import { useLiveToasts } from '../../hooks/useLiveToasts';
import { TrustBadge } from '../verification/TrustBadge';
import { studentTrust } from '../../utils/trust';
import { useWhatsApp } from '../../whatsapp/WhatsAppProvider';
import { liveCandidate } from '../../intelligence/marketplace';
import { actOnPlatform, saveStudentState } from '../../platform/backend';
import { createDemoState } from '../../utils/createState';
import { visibleToSponsors } from '../../platform/guardianRules';

const NAV = [
  { to: '/app', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, end: true, mobile: true },
  { to: '/app/radar', label: 'Risk Radar', short: 'Radar', icon: Radar, mobile: true },
  { to: '/app/funding', label: 'Funding Gap Solver', short: 'Funding', icon: HandCoins, mobile: true },
  { to: '/app/sponsors', label: 'Sponsors', short: 'Sponsors', icon: Handshake, mobile: true },
  { to: '/app/forecast', label: 'Forecast', short: 'Forecast', icon: ChartLine, mobile: false },
  { to: '/app/journey', label: 'Student Journey', short: 'Journey', icon: Route, mobile: false },
  { to: '/app/explore', label: 'Study Explorer', short: 'Explore', icon: Compass, mobile: false },
  { to: '/app/institutions', label: 'Universities and colleges', short: 'Colleges', icon: School, mobile: false },
  { to: '/app/residences', label: 'Residences', short: 'Residences', icon: BedDouble, mobile: false },
  { to: '/app/navigator', label: 'Student Navigator', short: 'Ask', icon: MessagesSquare, mobile: true },
  { to: '/app/documents', label: 'Documents', short: 'Docs', icon: FolderLock, mobile: false },
  { to: '/app/whatsapp', label: 'WhatsApp updates', short: 'WhatsApp', icon: MessageCircle, mobile: false },
  { to: '/app/verify', label: 'Verification', short: 'Verify', icon: ShieldCheck, mobile: false },
  { to: '/app/profile', label: 'Profile & preferences', short: 'Profile', icon: UserRound, mobile: false },
];

export function AppShell() {
  const { state, engine, dispatch } = useStudentContext();
  const { platform, session, signIn, signOut, dispatchPlatform, backend } = usePlatform();
  const [menuOpen, setMenuOpen] = useState(false);
  useLiveToasts((e) => (e.audience === 'student' || e.audience === 'all') && e.studentId === state?.id);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  // A student profile on this device implies a student session in this tab.
  useEffect(() => {
    if (state && (!session || session.role !== 'student')) signIn({ role: 'student', userId: state.id, email: '', demo: state.isDemoStudent });
  }, [state, session, signIn]);

  // Signed in to the backend: publish the anonymised profile sponsors see, whenever it changes.
  // A child's profile is only published once a parent or guardian has consented.
  const candidate = useMemo(() => {
    if (!backend || !state || session?.userId !== state.id) return '';
    const c = liveCandidate(state);
    return visibleToSponsors(c) ? JSON.stringify(c) : '';
  }, [backend, state, session?.userId]);
  useEffect(() => {
    if (!candidate) return;
    const t = window.setTimeout(() => dispatchPlatform({ type: 'publishCandidate', profile: JSON.parse(candidate) }), 1500);
    return () => window.clearTimeout(t);
  }, [candidate, dispatchPlatform]);

  const { unread: waUnread } = useWhatsApp();

  if (!state || !engine) return <NoProfile />;

  const myAppIds = new Set(platform.applications.filter((a) => a.studentId === state.id && ['accepted', 'approved', 'paid'].includes(a.status)).map((a) => a.id));
  const docRequests = platform.documents.filter((d) => myAppIds.has(d.applicationId) && (d.status === 'requested' || d.status === 'resubmit')).length;
  const flagged = engine.alerts.filter((a) => a.severity !== 'watch').length + docRequests;
  const offers = platform.applications.filter((a) => a.studentId === state.id && a.status === 'offered').length;
  const doSignOut = () => {
    signOut();
    navigate('/');
  };
  const stageLabel = EDUCATION_STAGES.find((s) => s.value === state.profile.educationStage)?.label;

  const navList = (onDark: boolean) => (
    <ul className="space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 text-[0.9375rem] font-medium transition-colors',
                onDark
                  ? isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  : isActive
                    ? 'bg-ink text-white'
                    : 'text-body hover:bg-sunken',
              )
            }
          >
            <Icon aria-hidden className="size-[18px] shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/app/radar' && flagged > 0 && (
              <span className="num rounded-full bg-amber-400 px-1.5 py-px text-[0.6875rem] font-bold text-ink" aria-label={`${flagged} active alerts`}>
                {flagged}
              </span>
            )}
            {to === '/app/whatsapp' && waUnread > 0 && (
              <span className="num rounded-full bg-veld-300 px-1.5 py-px text-[0.6875rem] font-bold text-ink" aria-label={`${waUnread} unread WhatsApp updates`}>
                {waUnread}
              </span>
            )}
            {to === '/app/documents' && docRequests > 0 && (
              <span className="num rounded-full bg-amber-400 px-1.5 py-px text-[0.6875rem] font-bold text-ink" aria-label={`${docRequests} document requests`}>
                {docRequests}
              </span>
            )}
            {to === '/app/sponsors' && offers > 0 && (
              <span className="num rounded-full bg-veld-300 px-1.5 py-px text-[0.6875rem] font-bold text-ink" aria-label={`${offers} offers waiting`}>
                {offers}
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-dvh lg:pl-[17rem]">
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17rem] flex-col bg-ink px-4 py-5 text-white lg:flex" aria-label="Main">
        <Link to="/" className="mb-8 px-2" aria-label={`${BRAND.name} home`}>
          <Logo dark />
        </Link>
        <Link to="/app/profile" className="mb-6 block rounded-2xl bg-white/5 p-4 hover:bg-white/10">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-veld-300 font-display text-lg font-bold text-ink">
              {state.profile.firstName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{state.profile.firstName}</p>
              <p className="truncate text-xs text-white/60">{stageLabel}</p>
            </div>
          </div>
          <TrustBadge level={studentTrust(state)} dark className="mt-3" />
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={engine.progress.ratio} label="Journey progress" tone="light" size="sm" />
            <span className="num text-xs text-white/70">{percent(engine.progress.ratio)}</span>
          </div>
        </Link>
        <nav aria-label="App sections">{navList(true)}</nav>
        <div className="mt-auto space-y-2 rounded-2xl border border-white/10 p-4 text-xs text-white/60">
          <p className="flex items-center gap-1.5 font-semibold text-white/80">
            <FlaskConical aria-hidden className="size-3.5" /> Prototype
          </p>
          <p>Figures, deadlines and some records are demonstration data saved only on this device.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <button type="button" onClick={doSignOut} className="inline-flex items-center gap-1.5 font-semibold text-veld-300 hover:text-white">
              <LogOut aria-hidden className="size-3.5" /> Sign out
            </button>
            <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1.5 font-semibold text-veld-300 hover:text-white">
              <RotateCcw aria-hidden className="size-3.5" /> Reset demo
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-15 items-center justify-between border-b border-line bg-paper px-4 lg:hidden">
        <Link to="/" aria-label={`${BRAND.name} home`}>
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="grid size-11 place-items-center rounded-full hover:bg-sunken"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <Menu aria-hidden className="size-6 text-ink" />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} aria-hidden />
          <div className="rise absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col overflow-y-auto overscroll-contain bg-ink p-4 text-white">
            <div className="mb-6 flex items-center justify-between">
              <Logo dark />
              <button type="button" onClick={() => setMenuOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close menu" autoFocus>
                <X aria-hidden className="size-6" />
              </button>
            </div>
            <nav aria-label="App sections">{navList(true)}</nav>
            <div className="mt-auto space-y-3 border-t border-white/10 pt-4 text-sm">
              <Link to="/" className="flex items-center gap-2 text-white/75 hover:text-white">
                <House aria-hidden className="size-4" /> {BRAND.name} homepage
              </Link>
              <button type="button" onClick={doSignOut} className="flex items-center gap-2 text-white/75 hover:text-white">
                <LogOut aria-hidden className="size-4" /> Sign out
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); setConfirmReset(true); }} className="flex items-center gap-2 text-veld-300">
                <RotateCcw aria-hidden className="size-4" /> Reset demo
              </button>
            </div>
          </div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="mx-auto max-w-[76rem] px-4 pt-6 pb-28 outline-none sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
        <Outlet />
      </main>

      {/* Mobile bottom tabs */}
      <nav aria-label="Quick sections" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="grid grid-cols-5">
          {NAV.filter((n) => n.mobile).map(({ to, short, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold', isActive ? 'text-veld-700' : 'text-muted')
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-b-full bg-veld-500" />}
                    <span className="relative">
                      <Icon aria-hidden className="size-[22px]" />
                      {to === '/app/radar' && flagged > 0 && (
                        <span aria-hidden className="absolute -top-1 -right-2 grid size-4 place-items-center rounded-full bg-amber-400 text-[0.625rem] font-bold text-ink">
                          {flagged}
                        </span>
                      )}
                      {to === '/app/sponsors' && offers > 0 && (
                        <span aria-hidden className="absolute -top-1 -right-2 grid size-4 place-items-center rounded-full bg-veld-600 text-[0.625rem] font-bold text-white">
                          {offers}
                        </span>
                      )}
                    </span>
                    {short}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset the demo?"
        description={
          backend
            ? 'This puts your plan and your own applications, offers and messages back to the start. Other demo accounts are not affected.'
            : 'This clears your profile, tasks, funding plan and the demo marketplace from this device.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Keep my data
            </Button>
            <Button
              variant="dark"
              disabled={resetting}
              onClick={async () => {
                // Signed in to the backend: reset the shared demo and this account's saved plan first, while the login is still valid.
                if (backend) {
                  setResetting(true);
                  await Promise.allSettled([actOnPlatform({ type: 'reset' }), state.isDemoStudent ? saveStudentState(createDemoState(state.id)) : Promise.resolve()]);
                  setResetting(false);
                }
                signOut();
                dispatch({ type: 'reset' });
                dispatchPlatform({ type: 'reset' });
                setConfirmReset(false);
                navigate('/');
              }}
            >
              Reset demo
            </Button>
          </>
        }
      >
        <p className="text-sm text-body">You can start again with your own answers or reload Tatenda’s demo profile from the homepage.</p>
      </Modal>
    </div>
  );
}

function NoProfile() {
  const { dispatch } = useStudentContext();
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4">
      <div className="max-w-md text-center">
        <Logo className="mb-8" />
        <h1 className="text-3xl font-bold">Build your pathway first</h1>
        <p className="mt-3 text-muted">
          Your dashboard is created from a few questions about your studies and budget. It takes about two minutes, or you can explore with a demo student.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <ButtonLink to="/start">Build my student pathway</ButtonLink>
          <Button variant="secondary" onClick={() => dispatch({ type: 'loadDemo' })}>
            Explore as Tatenda
          </Button>
        </div>
      </div>
    </div>
  );
}
