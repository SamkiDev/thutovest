import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building, CircleAlert, ClipboardCopy, GraduationCap, KeyRound } from 'lucide-react';
import type { Role, Session } from '../types';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/forms/Fields';
import { useStudentContext } from '../hooks/useStudent';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePlatform } from '../platform/PlatformProvider';
import { DEMO_ACCOUNTS } from '../data/platformSeed';
import { backendEnabled, signInWithBackend } from '../platform/backend';
import { cn } from '../utils/cn';

export default function SignInPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useStudentContext();
  const { signIn, platform } = usePlatform();
  const initialRole: Role = new URLSearchParams(location.search).get('role') === 'sponsor' ? 'sponsor' : 'student';
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Sign in');

  const demo = DEMO_ACCOUNTS[role];

  const finish = (s: Session) => {
    if (s.role === 'student' && (!state || state.id !== s.userId)) dispatch({ type: 'loadDemo' });
    signIn(s);
    navigate(s.role === 'student' ? '/app' : '/sponsor');
  };

  /** Browser-only demo sign-in, used when there is no backend or it can't be reached. */
  const enterOnDevice = (r: Role) => finish({ role: r, userId: DEMO_ACCOUNTS[r].userId, email: DEMO_ACCOUNTS[r].email, demo: true });

  const enterWithBackend = async (address: string, pass: string, fallback: Role | null) => {
    setBusy(true);
    setError(null);
    const result = await signInWithBackend(address, pass);
    setBusy(false);
    if (result.ok) return finish(result.session);
    if (result.reason === 'unavailable' && fallback) return enterOnDevice(fallback);
    setError(
      result.reason === 'unavailable'
        ? 'We can’t reach the server right now. Try again, or use a demo account below.'
        : 'That email and password don’t match an account.',
    );
  };

  const enter = (r: Role) => (backendEnabled ? void enterWithBackend(DEMO_ACCOUNTS[r].email, DEMO_ACCOUNTS[r].password, r) : enterOnDevice(r));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }
    const match = Object.entries(DEMO_ACCOUNTS).find(([, a]) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
    if (backendEnabled) return void enterWithBackend(email.trim(), password, match ? (match[0] as Role) : null);
    if (!match) {
      setError('That email and password don’t match an account. In this prototype, use one of the demo accounts below.');
      return;
    }
    enter(match[0] as Role);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(key);
        window.setTimeout(() => setCopied(null), 1500);
      },
      () => undefined,
    );
  };

  // On the shared backend these belong to other people, so the "this device" shortcut is browser-only.
  const otherSponsors = backendEnabled ? [] : platform.sponsors.filter((s) => !s.isDemo);

  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <Link to="/" aria-label="Home">
          <Logo dark />
        </Link>
        <div className="max-w-md">
          <p className="font-display text-[2.5rem] leading-[1.05] font-bold">Verified students. Verified sponsors. Money paid straight to the institution.</p>
          <p className="mt-4 text-white/70">Every account passes identity checks before anyone can connect, and every message is screened for scams.</p>
        </div>
        <p className="text-xs text-white/50">Prototype for the FNB App of the Year Hackathon 2026. Demo data is labelled throughout.</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" aria-label="Home" className="mb-8 inline-block lg:hidden">
            <Logo />
          </Link>
          <h1 className="text-3xl font-bold">Sign in</h1>

          <div role="tablist" aria-label="Account type" className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-line-strong bg-surface p-1">
            {(
              [
                ['student', 'Student', GraduationCap],
                ['sponsor', 'Sponsor', Building],
              ] as const
            ).map(([r, label, Icon]) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                onClick={() => {
                  setRole(r);
                  setError(null);
                }}
                className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold', role === r ? 'bg-ink text-white' : 'text-muted hover:text-ink')}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <TextField label="Email address" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-clay-50 p-3 text-sm text-clay-700">
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <section className="mt-6 rounded-2xl border border-dashed border-ink-300 bg-surface p-4" aria-labelledby="demo-heading">
            <h2 id="demo-heading" className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
              <KeyRound aria-hidden className="size-4" /> Demo {role} account for judges
            </h2>
            <dl className="mt-2 space-y-1 text-sm">
              {(
                [
                  ['Email', demo.email],
                  ['Password', demo.password],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="flex items-center gap-1 font-mono text-[0.8125rem] text-ink select-all">
                    {v}
                    <button type="button" onClick={() => copy(v, k)} className="rounded p-1 text-muted hover:text-ink" aria-label={`Copy ${k.toLowerCase()}`}>
                      <ClipboardCopy aria-hidden className="size-3.5" />
                    </button>
                    {copied === k && <span className="text-xs text-veld-700">Copied</span>}
                  </dd>
                </div>
              ))}
            </dl>
            <Button variant="secondary" size="sm" className="mt-3 w-full" disabled={busy} onClick={() => enter(role)}>
              Sign in as {role === 'student' ? 'Thando (student)' : 'Ridgeline Technologies (sponsor)'}
            </Button>
            <p className="mt-2 text-xs text-muted">Tip: open a student tab and a sponsor tab side by side. Changes appear in the other tab instantly.</p>
          </section>

          <div className="mt-6 space-y-2 text-sm">
            {role === 'student' ? (
              <>
                {state && state.id !== DEMO_ACCOUNTS.student.userId && (
                  <button
                    type="button"
                    onClick={() => {
                      signIn({ role: 'student', userId: state.id, email: '', demo: false });
                      navigate('/app');
                    }}
                    className="block font-semibold text-veld-700 hover:underline"
                  >
                    Continue as {state.profile.firstName} on this device
                  </button>
                )}
                <p className="text-muted">
                  New here?{' '}
                  <Link to="/start" className="font-semibold text-veld-700 hover:underline">
                    Build your student pathway
                  </Link>
                </p>
              </>
            ) : (
              <>
                {otherSponsors.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      signIn({ role: 'sponsor', userId: s.id, email: '', demo: false });
                      navigate('/sponsor');
                    }}
                    className="block font-semibold text-veld-700 hover:underline"
                  >
                    Continue as {s.name} on this device
                  </button>
                ))}
                <p className="text-muted">
                  Want to fund students?{' '}
                  <Link to="/sponsor/join" className="font-semibold text-veld-700 hover:underline">
                    Register your organisation
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
