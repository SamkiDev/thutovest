import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, CalendarClock, FileExclamationPoint, FlaskConical, HandCoins, Lock } from 'lucide-react';
import { PublicFooter, PublicHeader, scrollToSection } from '../components/layout/PublicChrome';
import { ButtonLink, Button } from '../components/ui/Button';
import { EnginePreview } from '../components/engine/EnginePreview';
import { CostFundingChart } from '../components/funding/GapBar';
import { createDemoState } from '../utils/createState';
import { computeEngine } from '../utils/engine';
import { summariseFunding } from '../utils/funding';
import { formatZAR } from '../utils/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { cn } from '../utils/cn';

export default function LandingPage() {
  useDocumentTitle('From “I want to study” to “I can graduate.”');

  return (
    <div className="bg-paper">
      <a href="#top" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('top')?.focus(); }}>
        Skip to content
      </a>
      <PublicHeader />
      <main id="top" tabIndex={-1} className="outline-none">
        <Hero />
        <EngineSection />
        <TwoSides />
        <HowItWorks />
        <ClosingCta />
      </main>
      <PublicFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[76rem] items-center gap-12 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-10 lg:pt-20 lg:pb-24">
        <div>
          <h1 className="font-display leading-[0.98] font-bold tracking-[-0.03em]">
            <span className="block text-[2.6rem] text-ink-400 sm:text-[3.6rem] lg:text-[4.1rem]">From “I want to study”</span>
            <span aria-hidden className="relative my-2 ml-4 block h-10 w-[3px] bg-veld-600 sm:h-12">
              <span className="absolute -top-1 -left-[3.5px] size-2.5 rounded-full border-2 border-veld-600 bg-paper" />
              <span className="absolute -bottom-1 -left-[3.5px] size-2.5 rounded-full bg-veld-600" />
            </span>
            <span className="block text-[2.6rem] text-ink sm:text-[3.6rem] lg:text-[4.1rem]">to “I can graduate.”</span>
          </h1>
          <p className="mt-8 max-w-[34rem] text-[1.0625rem] leading-relaxed text-body">
            Your deadlines, funding gap and verified sponsors who pay your university directly. One plan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/start" size="lg">
              Build my plan
            </ButtonLink>
            <Button size="lg" variant="secondary" icon={<ArrowDown aria-hidden className="size-4" />} onClick={() => scrollToSection('how')}>
              How it works
            </Button>
          </div>
          <p className="mt-4 text-sm text-body">
            Funding students?{' '}
            <Link to="/signin?role=sponsor" className="font-semibold text-veld-700 hover:underline underline-offset-4">
              Try the sponsor demo
            </Link>
          </p>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted">
            <Lock aria-hidden className="size-4" />
            No ID, passwords or bank details.
          </p>
        </div>
        <EnginePreview />
      </div>
    </section>
  );
}

const FEATURES = [
  { id: 'radar', name: 'Risk Radar', lede: 'What could stop you, and why.', body: 'Deadlines, missing documents and funding gaps, each with a reason and a fix.' },
  { id: 'gap', name: 'Funding Gap Solver', lede: 'Exactly how much is unfunded.', body: 'Every cost against your funding, with possible matches to check.' },
  { id: 'journey', name: 'Student Journey', lede: 'A to-do list that adapts.', body: 'Change your budget or a task and your next steps update.' },
  { id: 'assistant', name: 'Forecasts', lede: 'Warns you before you’re late.', body: 'Learns your pace and predicts which deadlines you could miss.' },
];

function EngineSection() {
  const demo = useMemo(() => createDemoState(), []);
  const engine = useMemo(() => computeEngine(demo), [demo]);
  const [living, setLiving] = useState<'residence' | 'home'>('residence');
  const costs = living === 'home' ? { ...demo.costs, accommodation: 0, transport: 9600 } : demo.costs;
  const funding = summariseFunding({ ...demo, costs });

  return (
    <section id="support" tabIndex={-1} aria-labelledby="engine-heading" className="scroll-mt-16 bg-ink py-20 text-white outline-none sm:py-24">
      <div className="mx-auto max-w-[76rem] px-4 sm:px-6 lg:px-10">
        <div className="max-w-2xl">
          <h2 id="engine-heading" className="text-[2rem] leading-tight font-bold text-white sm:text-[2.75rem]">
            Change one answer and the whole plan updates
          </h2>
          <p className="mt-4 text-lg text-white/70">Costs, deadlines, documents and funding live in one plan.</p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <article key={f.id} className="bg-ink p-6 sm:p-8">
              <span className="num font-display text-sm font-bold text-veld-300">0{i + 1}</span>
              <h3 className="mt-3 text-xl font-semibold text-white">{f.name}</h3>
              <p className="mt-1 font-medium text-veld-200">{f.lede}</p>
              <p className="mt-3 text-[0.9375rem] text-white/70">{f.body}</p>
            </article>
          ))}
        </div>

        {/* The parts working together */}
        <div className="mt-16 grid items-start gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-2xl font-semibold text-white">See the connection</h3>
            <p className="mt-2 text-white/70">Move Tatenda home and watch the gap change.</p>
            <div role="radiogroup" aria-label="Tatenda’s living arrangement" className="mt-5 inline-flex rounded-full bg-white/10 p-1">
              {(
                [
                  ['residence', 'Residence'],
                  ['home', 'At home'],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={living === v}
                  onClick={() => setLiving(v)}
                  className={cn('h-10 rounded-full px-4 text-sm font-semibold transition-colors', living === v ? 'bg-white text-ink' : 'text-white/75 hover:text-white')}
                >
                  {l}
                </button>
              ))}
            </div>
            <ul className="mt-8 space-y-4">
              {engine.alerts.slice(0, 3).map((a) => {
                const Icon = a.category === 'document' ? FileExclamationPoint : a.category === 'funding' ? HandCoins : CalendarClock;
                return (
                  <li key={a.id} className="flex gap-3">
                    <Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', a.severity === 'urgent' ? 'text-clay-100' : 'text-amber-100')} />
                    <p className="font-semibold text-white">{a.title}</p>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-3xl bg-surface p-5 text-body sm:p-8">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-muted">Tatenda’s funding gap</p>
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <FlaskConical aria-hidden className="size-3.5" /> Demo figures
              </span>
            </div>
            <p className="num mt-1 font-display text-[2.5rem] leading-none font-bold text-ink" aria-live="polite">
              {formatZAR(funding.gap)}
            </p>
            <div className="mt-6">
              <CostFundingChart costs={costs} funding={funding} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { title: 'Tell us where you are', body: 'Your stage, field, budget and what’s done. Two minutes.' },
  { title: 'Get one plan', body: 'Study options, costs, your funding gap, deadlines and risks.' },
  { title: 'Do the next step', body: 'Finish it and your plan updates straight away.' },
];

function HowItWorks() {
  return (
    <section id="how" tabIndex={-1} aria-labelledby="how-heading" className="scroll-mt-16 py-20 outline-none sm:py-24">
      <div className="mx-auto max-w-[76rem] px-4 sm:px-6 lg:px-10">
        <h2 id="how-heading" className="max-w-xl text-[2rem] leading-tight font-bold sm:text-[2.75rem]">
          How it works
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-bold text-white">{i + 1}</span>
                {i < STEPS.length - 1 && <span aria-hidden className="hidden h-[3px] flex-1 rounded-full bg-line md:block" />}
              </div>
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-[0.9375rem] text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TwoSides() {
  const sides = [
    {
      title: 'For students',
      points: ['A plan that adapts to your marks and deadlines', 'Warnings before a deadline or cash crunch', 'Verified sponsors matched to you, with consent', 'Sign and share documents in the app, never by email', 'WhatsApp updates when data is low'],
      cta: { label: 'Build my plan', to: '/start' },
      alt: { label: 'Try as Tatenda', to: '/signin' },
    },
    {
      title: 'For sponsors',
      points: ['Publish a fund with your criteria', 'A ranked shortlist of verified students', 'Documents checked before you approve', 'Pay institutions directly, track results'],
      cta: { label: 'Become a sponsor', to: '/sponsor/join' },
      alt: { label: 'Sponsor demo', to: '/signin?role=sponsor' },
    },
  ];
  return (
    <section aria-labelledby="sides-heading" className="py-20 sm:py-24">
      <div className="mx-auto max-w-[76rem] px-4 sm:px-6 lg:px-10">
        <h2 id="sides-heading" className="max-w-2xl text-[2rem] leading-tight font-bold sm:text-[2.75rem]">
          Students and sponsors, connected safely
        </h2>
        <p className="mt-3 max-w-2xl text-muted">Both sides are verified. Scam messages are blocked.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {sides.map((s) => (
            <article key={s.title} className="card flex flex-col p-6 sm:p-8">
              <h3 className="text-2xl font-semibold">{s.title}</h3>
              <ul className="mt-4 flex-1 space-y-3">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-3 text-body">
                    <span aria-hidden className="route-bullet" />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ButtonLink to={s.cta.to}>{s.cta.label}</ButtonLink>
                <Link to={s.alt.to} className="text-sm font-semibold text-veld-700 hover:underline underline-offset-4">
                  {s.alt.label}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="py-20 sm:py-24" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-[76rem] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-veld-700 px-6 py-10 text-white sm:px-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 id="cta-heading" className="text-[1.75rem] leading-tight font-bold text-white sm:text-[2.25rem]">
              Know your next step before the next deadline
            </h2>
            <p className="mt-2 text-white/80">Two minutes, or explore as Tatenda.</p>
          </div>
          <ButtonLink to="/start" size="lg" variant="light" className="shrink-0">
            Build my plan
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
