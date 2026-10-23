import { useMemo, useState } from 'react';
import { BRAND } from '../config/brand';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Minus, RotateCcw, Trash } from 'lucide-react';
import { RouteMark } from '../components/layout/Logo';
import type { EngineResult, StudentProfile } from '../types';
import { useStudent } from '../hooks/useStudent';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/ui/Misc';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AboutSection, ApplicationSection, GoalsSection, MoneySection } from '../components/forms/ProfileSections';
import { validateAll, toProfile, type ProfileDraft, type ProfileErrors } from '../utils/validation';
import { studentReducer } from '../state/studentReducer';
import { computeEngine } from '../utils/engine';
import { formatZAR } from '../utils/format';
import { cn } from '../utils/cn';

interface Change {
  label: string;
  before: string;
  after: string;
  direction: 'better' | 'worse' | 'neutral';
}

function diffEngines(a: EngineResult, b: EngineResult, field: string): Change[] {
  const changes: Change[] = [];
  if (a.funding.gap !== b.funding.gap) {
    changes.push({
      label: 'Estimated funding gap',
      before: formatZAR(a.funding.gap),
      after: formatZAR(b.funding.gap),
      direction: b.funding.gap < a.funding.gap ? 'better' : 'worse',
    });
  }
  if (a.tasks.length !== b.tasks.length) {
    changes.push({
      label: 'Steps in your journey',
      before: String(a.tasks.length),
      after: String(b.tasks.length),
      direction: 'neutral',
    });
  }
  if (a.alerts.length !== b.alerts.length) {
    changes.push({
      label: 'Risk alerts',
      before: String(a.alerts.length),
      after: String(b.alerts.length),
      direction: b.alerts.length < a.alerts.length ? 'better' : 'worse',
    });
  }
  const topA = a.matches.find((m) => m.option.field === field) ?? a.matches[0];
  const topB = b.matches.find((m) => m.option.field === field) ?? b.matches[0];
  if (topA?.option.id !== topB?.option.id) {
    changes.push({
      label: 'Top recommended option',
      before: topA ? `${topA.option.qualification} (${topA.institution.shortName})` : 'None',
      after: topB ? `${topB.option.qualification} (${topB.institution.shortName})` : 'None',
      direction: 'neutral',
    });
  }
  if (a.nextAction?.title !== b.nextAction?.title) {
    changes.push({ label: 'Next best action', before: a.nextAction?.title ?? 'None', after: b.nextAction?.title ?? 'None', direction: 'neutral' });
  }
  return changes;
}

export default function ProfilePage() {
  const { state, engine, dispatch } = useStudent();
  const notify = useToast();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProfileDraft>(state.profile);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [changes, setChanges] = useState<Change[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  useDocumentTitle('Profile & preferences');

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(state.profile), [draft, state.profile]);

  const update = (patch: Partial<ProfileDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setChanges(null);
  };

  // Live preview of the impact before saving.
  const preview = useMemo(() => {
    if (!dirty || Object.keys(validateAll(draft)).length) return null;
    const next = studentReducer(state, { type: 'updateProfile', profile: toProfile(draft) });
    return next ? diffEngines(engine, computeEngine(next), draft.field ?? state.profile.field) : null;
  }, [dirty, draft, state, engine]);

  const save = () => {
    const errs = validateAll(draft);
    setErrors(errs);
    if (Object.keys(errs).length) {
      notify('Check the highlighted fields before saving.', 'info');
      requestAnimationFrame(() => (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());
      return;
    }
    const profile: StudentProfile = toProfile(draft);
    setChanges(preview ?? []);
    dispatch({ type: 'updateProfile', profile });
    setDraft(profile);
    notify('Profile saved. Your pathway has been recalculated.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sections = [
    { id: 'about', title: 'About you', el: <AboutSection draft={draft} update={update} errors={errors} /> },
    { id: 'goals', title: 'Study interests', el: <GoalsSection draft={draft} update={update} errors={errors} /> },
    { id: 'money', title: 'Budget and funding preferences', el: <MoneySection draft={draft} update={update} errors={errors} /> },
    { id: 'apps', title: 'Applications and documents', el: <ApplicationSection draft={draft} update={update} errors={errors} /> },
  ];

  return (
    <div className="pb-24">
      <PageHeader
        title="Profile & preferences"
        description="Change anything here and the Student Success Engine recalculates your costs, journey steps, risk alerts and recommendations."
      />

      {changes && (
        <section className="rise mb-6 rounded-[var(--radius-card)] border border-veld-200 bg-veld-50 p-5 sm:p-6" aria-labelledby="changes-heading" role="status">
          <h2 id="changes-heading" className="flex items-center gap-2 text-lg font-semibold">
            <RouteMark className="size-5 text-veld-600" />
            What changed in your pathway
          </h2>
          {changes.length === 0 ? (
            <p className="mt-2 text-sm text-body">Your preferences were saved. Your plan, alerts and funding gap stay the same.</p>
          ) : (
            <ChangeList changes={changes} />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => navigate('/app')}>
              See updated dashboard
            </Button>
            <Link to="/app/journey" className="inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold text-veld-700 hover:underline">
              Open journey
            </Link>
          </div>
        </section>
      )}

      <div className="space-y-5">
        {sections.map((s) => (
          <section key={s.id} className="card p-5 sm:p-8" aria-labelledby={`sec-${s.id}`}>
            <h2 id={`sec-${s.id}`} className="mb-6 text-xl font-semibold">
              {s.title}
            </h2>
            {s.el}
          </section>
        ))}

        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-8" aria-labelledby="data-heading">
          <h2 id="data-heading" className="text-xl font-semibold">
            Your data
          </h2>
          <p className="mt-1 text-sm text-muted">
            Everything is stored in this browser only. {BRAND.name} never asks for ID numbers, passwords or bank details.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={<RotateCcw aria-hidden className="size-4" />}
              onClick={() => {
                dispatch({ type: 'loadDemo' });
                notify('Tatenda’s demo profile has been loaded.', 'info');
                navigate('/app');
              }}
            >
              Load Tatenda’s demo profile
            </Button>
            <Button variant="ghost" icon={<Trash aria-hidden className="size-4" />} onClick={() => setConfirmClear(true)} className="text-clay-600 hover:bg-clay-50">
              Clear all my data
            </Button>
          </div>
        </section>
      </div>

      {/* Sticky save bar */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-16 z-20 border-t border-line bg-surface px-4 py-3 transition-transform lg:bottom-0 lg:left-[17rem] lg:px-10',
          dirty ? 'translate-y-0' : 'pointer-events-none translate-y-[200%]',
        )}
        aria-hidden={!dirty}
      >
        <div className="mx-auto flex max-w-[76rem] flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-ink">Unsaved changes</p>
            {preview && preview.length > 0 ? (
              <p className="truncate text-muted">
                Preview: {preview.map((c) => `${c.label.toLowerCase()} ${c.before} to ${c.after}`).slice(0, 2).join('; ')}
              </p>
            ) : (
              <p className="text-muted">Save to recalculate your pathway.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" tabIndex={dirty ? 0 : -1} onClick={() => { setDraft(state.profile); setErrors({}); }}>
              Discard
            </Button>
            <Button tabIndex={dirty ? 0 : -1} onClick={save}>
              Save and recalculate
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all your data?"
        description="This removes your profile, tasks and funding plan from this browser. It can’t be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="dark"
              onClick={() => {
                dispatch({ type: 'reset' });
                navigate('/');
              }}
            >
              Clear my data
            </Button>
          </>
        }
      >
        <p className="text-sm">You can build a new pathway at any time.</p>
      </Modal>
    </div>
  );
}

function ChangeList({ changes }: { changes: Change[] }) {
  return (
    <ul className="mt-3 divide-y divide-veld-100">
      {changes.map((c) => {
        const Icon = c.direction === 'better' ? ArrowDownRight : c.direction === 'worse' ? ArrowUpRight : Minus;
        return (
          <li key={c.label} className="grid gap-1 py-3 text-sm sm:grid-cols-[13rem_1fr]">
            <span className="font-semibold text-ink">{c.label}</span>
            <span className="flex flex-wrap items-center gap-2 text-body">
              <span className="text-muted line-through decoration-ink-300">{c.before}</span>
              <Icon aria-hidden className={cn('size-4', c.direction === 'better' ? 'text-veld-600' : c.direction === 'worse' ? 'text-clay-600' : 'text-muted')} />
              <span className="font-semibold">{c.after}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
