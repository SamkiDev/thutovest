import { useEffect, useRef, useState } from 'react';
import { BRAND } from '../config/brand';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CircleCheck, Lock, Pencil, X } from 'lucide-react';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Misc';
import { AboutSection, ApplicationSection, GoalsSection, MoneySection } from '../components/forms/ProfileSections';
import { useStudentContext } from '../hooks/useStudent';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { EMPTY_DRAFT, toProfile, validateSection, type ProfileDraft, type ProfileErrors, type ProfileSection } from '../utils/validation';
import {
  APPLICATION_PROGRESS,
  DOCUMENTS,
  EDUCATION_STAGES,
  FIELDS,
  FUNDING_NEED,
  INCOME_BANDS,
  LIVING,
  STUDY_MODES,
} from '../data/labels';
import { institutionById } from '../data/institutions';
import { formatZAR } from '../utils/format';
import { cn } from '../utils/cn';

const STEPS: { id: ProfileSection | 'review'; title: string; description: string }[] = [
  { id: 'about', title: 'About you', description: 'A few basics so your plan speaks to where you are now.' },
  { id: 'goals', title: 'Study goals', description: 'What you want to study and how. This shapes your recommended options.' },
  { id: 'money', title: 'Money and funding', description: 'Used to estimate your funding gap. Rough numbers are fine.' },
  { id: 'applications', title: 'Applications', description: 'Tell us what’s done so your to-do list starts in the right place.' },
  { id: 'review', title: 'Review', description: 'Check your answers, then build your pathway.' },
];

const DRAFT_KEY = `${BRAND.storagePrefix}:onboarding-draft`;

function loadDraft(): ProfileDraft {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as ProfileDraft) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

const BUILD_STEPS = ['Matching study options', 'Estimating your costs', 'Checking deadlines and documents', 'Choosing your next best action'];

export default function OnboardingPage() {
  const { dispatch } = useStudentContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProfileDraft>(loadDraft);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [building, setBuilding] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useDocumentTitle('Build your pathway');

  useEffect(() => {
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [step]);

  const update = (patch: Partial<ProfileDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    // clear errors for fields being edited
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof ProfileErrors];
      return next;
    });
  };

  const current = STEPS[step];

  const goNext = () => {
    if (current.id !== 'review') {
      const errs = validateSection(draft, current.id);
      setErrors(errs);
      if (Object.keys(errs).length > 0) {
        requestAnimationFrame(() => (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());
        return;
      }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const build = () => {
    // Re-validate everything in case a step was skipped via Edit links.
    for (let i = 0; i < 4; i++) {
      const errs = validateSection(draft, STEPS[i].id as ProfileSection);
      if (Object.keys(errs).length) {
        setErrors(errs);
        setStep(i);
        return;
      }
    }
    setBuilding(0);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = reduce ? 120 : 380;
    BUILD_STEPS.forEach((_, i) => window.setTimeout(() => setBuilding(i + 1), tick * (i + 1)));
    window.setTimeout(() => {
      dispatch({ type: 'completeOnboarding', profile: toProfile(draft) });
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      navigate('/app');
    }, tick * (BUILD_STEPS.length + 1));
  };

  const startDemo = () => {
    dispatch({ type: 'loadDemo' });
    navigate('/app');
  };

  if (building !== null) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink px-6 text-white">
        <div className="w-full max-w-sm" role="status" aria-live="polite">
          <Logo dark />
          <h1 className="mt-8 text-3xl font-bold text-white">Building your pathway, {draft.firstName.trim()}</h1>
          <ul className="mt-6 space-y-3">
            {BUILD_STEPS.map((s, i) => (
              <li key={s} className={cn('flex items-center gap-3 text-[0.9375rem] transition-opacity', i <= building ? 'opacity-100' : 'opacity-35')}>
                {i < building ? (
                  <CircleCheck aria-hidden className="size-5 text-veld-300" />
                ) : i === building ? (
                  <Spinner className="size-5 text-veld-300" label={s} />
                ) : (
                  <span aria-hidden className="size-5 rounded-full border-2 border-white/30" />
                )}
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label={`${BRAND.name} home`}>
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <span className="hidden sm:block">
              <Button variant="ghost" size="sm" onClick={startDemo}>
                Skip, use demo
              </Button>
            </span>
            <Link to="/" className="grid size-10 place-items-center rounded-full text-muted hover:bg-sunken hover:text-ink" aria-label="Leave setup">
              <X aria-hidden className="size-5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[14rem_1fr] lg:gap-12">
        {/* Progress */}
        <nav aria-label="Setup progress">
          <p className="mb-2 text-sm font-semibold text-muted lg:hidden">
            Step {step + 1} of {STEPS.length}: <span className="text-ink">{current.title}</span>
          </p>
          <div className="flex gap-1.5 lg:hidden" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s.id} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-veld-500' : 'bg-line')} />
            ))}
          </div>
          <ol className="relative hidden lg:block">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={s.id} className="relative flex gap-3 pb-8 last:pb-0">
                  {i < STEPS.length - 1 && <span aria-hidden className={cn('absolute top-7 left-[13px] h-[calc(100%-1.5rem)] w-[3px] rounded-full', done ? 'bg-veld-500' : 'bg-line')} />}
                  <span
                    aria-hidden
                    className={cn(
                      'relative grid size-[29px] shrink-0 place-items-center rounded-full border-[3px] text-xs font-bold',
                      done && 'border-veld-600 bg-veld-600 text-white',
                      active && 'border-veld-500 bg-surface text-veld-700',
                      !done && !active && 'border-line-strong bg-surface text-muted',
                    )}
                  >
                    {done ? <Check className="size-3.5" strokeWidth={3.5} /> : i + 1}
                  </span>
                  <span className="pt-1">
                    {done ? (
                      <button type="button" onClick={() => setStep(i)} className="text-sm font-semibold text-ink hover:text-veld-700 hover:underline">
                        {s.title}
                      </button>
                    ) : (
                      <span className={cn('text-sm font-semibold', active ? 'text-ink' : 'text-muted')} aria-current={active ? 'step' : undefined}>
                        {s.title}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-8 hidden items-start gap-2 text-xs text-muted lg:flex">
            <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            Answers stay in this browser. We never ask for ID numbers, passwords or bank details.
          </p>
        </nav>

        <main>
          <div className="card p-5 sm:p-8">
            <h1 ref={headingRef} tabIndex={-1} className="text-[1.75rem] font-bold outline-none sm:text-[2rem]">
              {current.title}
            </h1>
            <p className="mt-1 mb-8 text-muted">{current.description}</p>

            {current.id === 'about' && <AboutSection draft={draft} update={update} errors={errors} />}
            {current.id === 'goals' && <GoalsSection draft={draft} update={update} errors={errors} />}
            {current.id === 'money' && <MoneySection draft={draft} update={update} errors={errors} />}
            {current.id === 'applications' && <ApplicationSection draft={draft} update={update} errors={errors} />}
            {current.id === 'review' && <Review draft={draft} onEdit={setStep} />}

            <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 ? (
                <Button variant="ghost" icon={<ArrowLeft aria-hidden className="size-4" />} onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              ) : (
                <span className="sm:hidden">
                  <Button variant="ghost" onClick={startDemo} className="w-full">
                    Skip, use demo
                  </Button>
                </span>
              )}
              {current.id === 'review' ? (
                <Button size="lg" onClick={build}>
                  Build my student pathway
                </Button>
              ) : (
                <Button size="lg" onClick={goNext} className="sm:ml-auto">
                  Continue
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Review({ draft, onEdit }: { draft: ProfileDraft; onEdit: (step: number) => void }) {
  const groups: { step: number; title: string; rows: [string, string][] }[] = [
    {
      step: 0,
      title: 'About you',
      rows: [
        ['Name', draft.firstName.trim() || 'Not given'],
        ['Stage', EDUCATION_STAGES.find((s) => s.value === draft.educationStage)?.label ?? 'Not chosen'],
        ['Province', draft.province],
        ['18 or older', draft.isAdult ? 'Yes' : 'No, guardian consent needed for sponsors'],
      ],
    },
    {
      step: 1,
      title: 'Study goals',
      rows: [
        ['Field', FIELDS.find((f) => f.value === draft.field)?.label ?? 'Not chosen'],
        ['Study mode', STUDY_MODES.find((m) => m.value === draft.studyMode)?.label ?? ''],
        ['Institutions', draft.preferredInstitutionIds.map((id) => institutionById(id)?.shortName).join(', ') || 'Open to any'],
        ['Estimated APS', draft.apsEstimate != null ? String(draft.apsEstimate) : 'Not given'],
      ],
    },
    {
      step: 2,
      title: 'Money and funding',
      rows: [
        ['Own budget per year', formatZAR(draft.annualBudget)],
        ['Living arrangement', LIVING.find((l) => l.value === draft.livingArrangement)?.label ?? ''],
        ['Funding assistance', FUNDING_NEED.find((f) => f.value === draft.fundingNeed)?.label ?? ''],
        ['Household income', INCOME_BANDS.find((b) => b.value === draft.householdIncome)?.label ?? ''],
      ],
    },
    {
      step: 3,
      title: 'Applications',
      rows: [
        ['Progress', APPLICATION_PROGRESS.find((a) => a.value === draft.applicationProgress)?.label ?? ''],
        ['Documents ready', draft.documentsReady.map((d) => DOCUMENTS.find((x) => x.value === d)?.label).join(', ') || 'None yet'],
      ],
    },
  ];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g.title} className="rounded-2xl border border-line" aria-labelledby={`rev-${g.step}`}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 id={`rev-${g.step}`} className="font-sans text-sm font-semibold">
              {g.title}
            </h2>
            <button type="button" onClick={() => onEdit(g.step)} className="inline-flex items-center gap-1 text-sm font-semibold text-veld-700 hover:underline">
              <Pencil aria-hidden className="size-3.5" /> Edit <span className="sr-only">{g.title}</span>
            </button>
          </div>
          <dl className="divide-y divide-line">
            {g.rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9.5rem_1fr] gap-3 px-4 py-3 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
