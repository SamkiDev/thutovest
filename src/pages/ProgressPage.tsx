import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, BookOpenCheck, FileUp, GraduationCap, Minus, Plus, ShieldAlert, Trash2, TrendingUp, UserRoundPlus } from 'lucide-react';
import type { FundApplication, MarkRecord, StudentState, SubjectMark } from '../types';
import { useStudent } from '../hooks/useStudent';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePlatform } from '../platform/PlatformProvider';
import { PageHeader } from '../components/ui/Misc';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Why } from '../components/ui/Why';
import { SelectField } from '../components/forms/Fields';
import { analyseMarks, apsFromMarks, averageOf, fundedApplications, nscLevel, STATUS_LABEL, type ProgressAnalysis, type ProgressStatus } from '../platform/progressRules';
import { optionById } from '../data/studyOptions';
import { institutionById } from '../data/institutions';
import { makeId } from '../utils/createState';
import { formatDate } from '../utils/dates';
import { cn } from '../utils/cn';

const STATUS_TONE: Record<ProgressStatus, 'veld' | 'amber' | 'clay'> = { 'on-track': 'veld', watch: 'amber', 'at-risk': 'clay' };

const SCHOOL_TERMS = ['Term 1', 'June exams', 'Term 3 tests', 'Trial exams', 'Final NSC results'];
const UNI_TERMS = ['Semester 1 tests', 'Semester 1 exams', 'Semester 2 tests', 'Semester 2 exams'];

const DEFAULT_SCHOOL_SUBJECTS = ['English Home Language', 'Mathematics', 'Physical Sciences', 'Life Sciences', 'Geography', 'First Additional Language', 'Life Orientation'];

const isSchool = (s: StudentState) => s.profile.educationStage.startsWith('grade');

/**
 * Reading a report is simulated in this demo: it proposes marks based on the
 * last term, with Maths and Physical Sciences slipping, so the analysis has
 * something to find. The student checks every mark before saving.
 */
function marksFromReport(latest: MarkRecord | undefined, school: boolean): SubjectMark[] {
  if (!latest) {
    return (school ? DEFAULT_SCHOOL_SUBJECTS : ['Module 1', 'Module 2', 'Module 3', 'Module 4']).map((subject, i) => ({ subject, mark: [64, 55, 52, 61, 66, 70, 78][i] ?? 60 }));
  }
  const shift = (subject: string) => (/mathematics/i.test(subject) ? -7 : /physical sciences/i.test(subject) ? -6 : /english/i.test(subject) ? -1 : 1);
  return latest.subjects.map((s) => ({ subject: s.subject, mark: Math.max(0, Math.min(100, s.mark + shift(s.subject))) }));
}

/** Concrete next steps from the analysis, most useful first. */
function adviceFor(state: StudentState, a: ProgressAnalysis, funded: boolean): { title: string; detail: string }[] {
  const out: { title: string; detail: string }[] = [];
  const school = isSchool(state);
  const latest = state.marks?.at(-1);
  const focus = a.subjectsDown[0] ?? (a.weak[0] ? { subject: a.weak[0].subject, from: a.weak[0].mark, to: a.weak[0].mark } : null);

  if (focus) {
    out.push({
      title: `Make ${focus.subject} your first focus`,
      detail:
        focus.from !== focus.to
          ? `It fell ${focus.from - focus.to} points to ${focus.to}%. Redo the questions you lost marks on this term before moving on, and ask your ${school ? 'teacher' : 'lecturer'} which topics to prioritise.`
          : `At ${focus.to}% it is your weakest subject. Two short sessions a week beat one long one.`,
    });
  }
  if (funded && a.status !== 'on-track') {
    out.push({
      title: 'Ask your sponsor for a tutor',
      detail: 'Sponsors would rather help early than review your funding later. Use the form on this page; it goes straight to them.',
    });
  }
  if (a.passMark && a.latest) {
    const gap = Math.round((a.passMark - a.latest.average) * 10) / 10;
    out.push(
      gap > 0
        ? { title: `Close a ${gap}-point gap to your bursary’s pass mark`, detail: `Your bursary asks for ${a.passMark}%. Tell your sponsor now, with a plan, rather than waiting for final results.` }
        : { title: 'Keep your bursary safe', detail: `You are above the ${a.passMark}% your bursary asks for. Keep adding marks after every test so you see a slip before it matters.` },
    );
  }

  // School: what the new marks mean for the courses the student saved.
  if (school && a.aps != null) {
    const maths = latest?.subjects.find((s) => /^mathematics$/i.test(s.subject.trim()));
    const missed = state.savedOptionIds
      .map((id) => optionById(id))
      .filter((o): o is NonNullable<typeof o> => Boolean(o))
      .map((o) => {
        const needMaths = Number(o.subjects.match(/Mathematics (\d)/)?.[1] ?? 0);
        const reasons = [
          ...(o.apsGuide > a.aps! ? [`APS ${o.apsGuide} (you have ${a.aps})`] : []),
          ...(maths && needMaths && nscLevel(maths.mark) < needMaths ? [`Maths level ${needMaths} (you have ${nscLevel(maths.mark)})`] : []),
        ];
        return { o, reasons };
      })
      .filter((x) => x.reasons.length);
    for (const { o, reasons } of missed.slice(0, 2)) {
      out.push({
        title: `${o.qualification} at ${institutionById(o.institutionId)?.shortName ?? 'your choice'} is now out of reach`,
        detail: `It asks for ${reasons.join(' and ')}. Final marks can still change this, but look at a backup with a lower entry requirement in the Study Explorer.`,
      });
    }
  }

  out.push(
    school
      ? { title: 'Free help', detail: 'Siyavula has free Maths and Physical Sciences practice for Grades 10 to 12, and past NSC papers with memos are free from the Department of Basic Education.' }
      : { title: 'Free help on campus', detail: 'Your university’s tutoring or academic development centre is free for registered students, and lecturers keep consultation hours.' },
  );
  if (!a.latest || a.status === 'on-track') {
    out.unshift({ title: 'Keep going', detail: 'Add your marks after every test or term. The sooner a slip shows up, the easier it is to fix.' });
  }
  return out;
}

export default function ProgressPage() {
  const { state, dispatch } = useStudent();
  const { platform, dispatchPlatform } = usePlatform();
  const notify = useToast();
  useDocumentTitle('Progress');

  const school = isSchool(state);
  const marks = state.marks ?? [];
  const funded = fundedApplications(platform, state.id);
  const fundOf = (fundId: string) => platform.funds.find((f) => f.id === fundId);
  const passMark = Math.max(0, ...funded.map((a) => fundOf(a.fundId)?.terms?.minPassMark ?? 0)) || undefined;
  const analysis = useMemo(() => analyseMarks(marks, passMark), [marks, passMark]);
  const advice = useMemo(() => adviceFor(state, analysis, funded.length > 0), [state, analysis, funded.length]);

  return (
    <div>
      <PageHeader
        title="Your progress"
        description="Add your marks after every test or term. Each time, ThutoVest reads them, spots a slip early and suggests what to do next."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
        <div className="space-y-5 lg:space-y-6">
          <Summary analysis={analysis} school={school} profileAps={state.profile.apsEstimate} onUseAps={(aps) => {
            dispatch({ type: 'updateProfile', profile: { ...state.profile, apsEstimate: aps } });
            notify(`Your APS is now ${aps}. Your study options have been updated.`, 'success');
          }} />

          <section className="card p-5 sm:p-6" aria-labelledby="advice-heading">
            <h2 id="advice-heading" className="flex items-center gap-2 text-lg font-semibold">
              <BookOpenCheck aria-hidden className="size-5 text-veld-600" /> What to do next
            </h2>
            <ol className="mt-3 space-y-3">
              {advice.map((a, i) => (
                <li key={a.title} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-veld-50 text-xs font-bold text-veld-700">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-ink">{a.title}</p>
                    <p className="text-sm text-body">{a.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <AddMarks state={state} school={school} onSave={(record) => {
            const next = analyseMarks([...marks, record], passMark);
            const change = next.change == null ? '' : next.change < 0 ? `, down ${Math.abs(next.change)} points` : next.change > 0 ? `, up ${next.change} points` : ', no change';
            dispatch({ type: 'addMarks', record, summary: `Added ${record.term} marks: average ${averageOf(record.subjects)}%${change}` });
            notify(`${record.term} saved. ${STATUS_LABEL[next.status]}${next.reasons[0] ? `: ${next.reasons[0]}` : ''}.`, next.status === 'on-track' ? 'success' : 'info');
          }} />
        </div>

        <div className="space-y-5 lg:space-y-6">
          {funded.length > 0 ? (
            funded.map((app) => {
              const fund = fundOf(app.fundId);
              const sponsor = platform.sponsors.find((s) => s.id === fund?.sponsorId);
              return (
                <TutorPanel
                  key={app.id}
                  sponsorName={sponsor?.name ?? 'Your sponsor'}
                  fundName={fund?.name ?? 'Your bursary'}
                  passMark={fund?.terms?.minPassMark}
                  requests={app.tutorRequests ?? []}
                  warnings={app.warnings ?? []}
                  subjects={[...(marks.at(-1)?.subjects ?? [])].sort((a, b) => a.mark - b.mark).map((s) => s.subject)}
                  suggested={analysis.subjectsDown[0]?.subject ?? analysis.weak[0]?.subject}
                  onSend={(subject, note) => {
                    dispatchPlatform({ type: 'requestTutor', applicationId: app.id, subject, note, studentName: state.profile.firstName });
                    notify(`Tutor request for ${subject} sent to ${sponsor?.name ?? 'your sponsor'}.`, 'success');
                  }}
                />
              );
            })
          ) : (
            <section className="card p-5 sm:p-6" aria-labelledby="tutor-heading">
              <h2 id="tutor-heading" className="flex items-center gap-2 text-lg font-semibold">
                <UserRoundPlus aria-hidden className="size-5 text-veld-600" /> Ask for a tutor
              </h2>
              <p className="mt-2 text-sm text-body">
                Once a sponsor funds you, you can ask them for a tutor here, and they will see your term averages (never your report or subject marks).
              </p>
              <Link to="/app/sponsors" className="mt-3 inline-block text-sm font-semibold text-veld-700 hover:underline">
                Find a sponsor
              </Link>
            </section>
          )}

          <History marks={marks} onRemove={(id) => dispatch({ type: 'removeMarks', id })} />
        </div>
      </div>
    </div>
  );
}

function Summary({ analysis: a, school, profileAps, onUseAps }: { analysis: ProgressAnalysis; school: boolean; profileAps: number | null; onUseAps: (aps: number) => void }) {
  if (!a.latest) {
    return (
      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp aria-hidden className="size-5 text-veld-600" /> No marks yet
        </h2>
        <p className="mt-2 text-sm text-body">Add your latest marks below. From the second set on, you will see how you are trending.</p>
      </section>
    );
  }
  const Arrow = a.change == null || a.change === 0 ? Minus : a.change > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="summary-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="summary-heading" className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp aria-hidden className="size-5 text-veld-600" /> {a.latest.term}
        </h2>
        <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-xs text-muted">Average</dt>
          <dd className="font-display text-2xl font-bold text-ink">{a.latest.average}%</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Since last time</dt>
          <dd className={cn('flex items-center gap-1 font-display text-2xl font-bold', a.change != null && a.change < 0 ? 'text-clay-700' : 'text-ink')}>
            <Arrow aria-hidden className="size-5" />
            {a.change == null ? 'n/a' : `${a.change > 0 ? '+' : ''}${a.change}`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{a.passMark ? 'Bursary pass mark' : school ? 'APS from marks' : 'Credits passed'}</dt>
          <dd className="font-display text-2xl font-bold text-ink">
            {a.passMark ? `${a.passMark}%` : school ? (a.aps ?? 'n/a') : a.latest.creditsTaken ? `${a.latest.creditsPassed}/${a.latest.creditsTaken}` : 'n/a'}
          </dd>
        </div>
      </dl>
      {a.reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm">
          {a.reasons.map((r) => (
            <li key={r} className="flex items-start gap-2 text-body">
              <ShieldAlert aria-hidden className={cn('mt-0.5 size-4 shrink-0', a.status === 'at-risk' ? 'text-clay-600' : 'text-amber-700')} />
              {r}
            </li>
          ))}
        </ul>
      )}
      {school && a.aps != null && profileAps != null && a.aps !== profileAps && (
        <div className="mt-4 rounded-xl bg-sunken p-3 text-sm">
          <p className="text-body">
            These marks give an APS of <strong>{a.aps}</strong>
            {a.previousAps != null && a.previousAps !== a.aps ? ` (it was ${a.previousAps} last time)` : ''}. Your profile says {profileAps}.
          </p>
          <Button size="sm" variant="secondary" className="mt-2" onClick={() => onUseAps(a.aps!)}>
            Use APS {a.aps} for my study options
          </Button>
        </div>
      )}
      <Why className="mt-3">
        The average leaves out Life Orientation. APS counts your best six subjects by NSC level (80% and above is 7). A drop of 5 points or more (overall or in one subject), or being within 3 points of a bursary’s pass mark, is flagged to watch. Below the pass mark, or a subject under 40%, is at risk.
      </Why>
    </section>
  );
}

function AddMarks({ state, school, onSave }: { state: StudentState; school: boolean; onSave: (r: MarkRecord) => void }) {
  const latest = state.marks?.at(-1);
  const year = new Date().getFullYear();
  const terms = (school ? SCHOOL_TERMS : UNI_TERMS).map((t) => `${t}, ${year}`);
  const used = new Set(state.marks?.map((m) => m.term));
  const blankRows = () => (latest?.subjects ?? (school ? DEFAULT_SCHOOL_SUBJECTS : ['Module 1', 'Module 2', 'Module 3', 'Module 4']).map((subject) => ({ subject, mark: 0 }))).map((s) => ({ subject: s.subject, mark: '' }));
  const [term, setTerm] = useState(terms.find((t) => !used.has(t)) ?? terms[0]);
  const [rows, setRows] = useState<{ subject: string; mark: string }[]>(blankRows);
  const [credits, setCredits] = useState({ taken: '', passed: '' });
  const [fromReport, setFromReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readReport = (fileName: string) => {
    setRows(marksFromReport(latest, school).map((s) => ({ subject: s.subject, mark: String(s.mark) })));
    setFromReport(fileName);
    setError(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const subjects = rows
      .map((r) => ({ subject: r.subject.trim(), mark: Number(r.mark) }))
      .filter((r) => r.subject && r.mark !== 0 && !Number.isNaN(r.mark));
    if (subjects.length < 2) return setError('Add at least two subjects with a mark.');
    if (subjects.some((s) => s.mark < 0 || s.mark > 100)) return setError('Marks are percentages from 0 to 100.');
    if (used.has(term)) return setError(`You already added ${term}. Remove it first to replace it.`);
    const taken = Number(credits.taken) || 0;
    const passed = Math.min(Number(credits.passed) || 0, taken);
    onSave({
      id: makeId('marks'),
      term,
      addedAt: new Date().toISOString(),
      subjects: subjects.map((s) => ({ ...s, mark: Math.round(s.mark) })),
      ...(taken ? { creditsTaken: taken, creditsPassed: passed } : {}),
      source: fromReport ? 'report' : 'typed',
      ...(fromReport ? { fileName: fromReport } : {}),
    });
    setFromReport(null);
    setError(null);
    setRows(blankRows());
    const next = terms.find((t) => t !== term && !used.has(t));
    if (next) setTerm(next);
  };

  const preview = school ? apsFromMarks(rows.map((r) => ({ subject: r.subject, mark: Number(r.mark) || 0 })).filter((r) => r.mark > 0)) : null;

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="add-heading">
      <h2 id="add-heading" className="flex items-center gap-2 text-lg font-semibold">
        <GraduationCap aria-hidden className="size-5 text-veld-600" /> Add new marks
      </h2>
      <p className="mt-1 text-sm text-muted">Type them in, or let ThutoVest read them from your report.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,image/*"
          className="sr-only"
          aria-label="Choose your report"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readReport(f.name);
            e.target.value = '';
          }}
        />
        <Button type="button" variant="secondary" size="sm" icon={<FileUp aria-hidden className="size-4" />} onClick={() => fileRef.current?.click()}>
          Read my report
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => readReport(`${term.replace(/[ ,]+/g, '_')}_report_${state.profile.firstName}.pdf`)}>
          Use a sample report
        </Button>
      </div>
      {fromReport && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800" role="status">
          Read from {fromReport}. Reading reports is simulated in this demo: check every mark below before you save.
        </p>
      )}

      <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
        <SelectField label="Which results?" value={term} onChange={(e) => setTerm(e.target.value)} options={terms.map((t) => ({ value: t, label: used.has(t) ? `${t} (added)` : t }))} />

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-ink">{school ? 'Subjects' : 'Modules'} and marks (%)</legend>
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  aria-label={`${school ? 'Subject' : 'Module'} ${i + 1}`}
                  value={r.subject}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, subject: e.target.value } : x)))}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
                />
                <input
                  aria-label={`Mark for ${r.subject || `${school ? 'subject' : 'module'} ${i + 1}`}`}
                  inputMode="numeric"
                  value={r.mark}
                  placeholder="%"
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, mark: e.target.value.replace(/[^\d]/g, '').slice(0, 3) } : x)))}
                  className="h-11 w-16 rounded-xl border border-line-strong bg-surface px-3 text-center text-sm text-ink focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink"
                  aria-label={`Remove ${r.subject || 'this row'}`}
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setRows([...rows, { subject: '', mark: '' }])} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-veld-700 hover:underline">
            <Plus aria-hidden className="size-4" /> Add a {school ? 'subject' : 'module'}
          </button>
        </fieldset>

        {!school && (
          <div className="grid grid-cols-2 gap-3">
            {(['taken', 'passed'] as const).map((k) => (
              <label key={k} className="text-sm font-semibold text-ink">
                Credits {k}
                <input
                  inputMode="numeric"
                  value={credits[k]}
                  onChange={(e) => setCredits({ ...credits, [k]: e.target.value.replace(/[^\d]/g, '').slice(0, 3) })}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm font-normal focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
                />
              </label>
            ))}
          </div>
        )}

        {preview != null && <p className="text-sm text-muted">APS from these marks: <strong className="text-ink">{preview}</strong></p>}
        {error && (
          <p className="text-sm font-medium text-clay-700" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full sm:w-auto">
          Save and analyse
        </Button>
      </form>
    </section>
  );
}

function TutorPanel({
  sponsorName,
  fundName,
  passMark,
  requests,
  warnings,
  subjects,
  suggested,
  onSend,
}: {
  sponsorName: string;
  fundName: string;
  passMark?: number;
  requests: NonNullable<FundApplication['tutorRequests']>;
  warnings: NonNullable<FundApplication['warnings']>;
  subjects: string[];
  suggested?: string;
  onSend: (subject: string, note: string) => void;
}) {
  const [subject, setSubject] = useState(suggested ?? subjects[0] ?? '');
  const [note, setNote] = useState('');
  const open = requests.filter((r) => r.status === 'requested').length;
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="tutor-heading">
      <h2 id="tutor-heading" className="flex items-center gap-2 text-lg font-semibold">
        <UserRoundPlus aria-hidden className="size-5 text-veld-600" /> {fundName}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Funded by {sponsorName}
        {passMark ? `. Asks for an average of ${passMark}% to keep it.` : '.'} They see your term averages, never your report or subject marks.
      </p>

      {warnings.length > 0 && (
        <div className="mt-4 space-y-2">
          {warnings.map((w) => (
            <div key={w.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="note">
              <p className="font-semibold">Early warning, {formatDate(w.at.slice(0, 10))}</p>
              <p className="mt-0.5">
                {sponsorName} noticed your average of {w.average}% for {w.term}
                {w.passMark ? ` against the ${w.passMark}% this bursary asks for` : ''}. No decision has been made. Reply in your messages and ask for a tutor below.
              </p>
            </div>
          ))}
        </div>
      )}

      {subjects.length > 0 ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!subject || open >= 3) return;
            onSend(subject, note.trim());
            setNote('');
          }}
        >
          <SelectField label="Ask for a tutor in" value={subject} onChange={(e) => setSubject(e.target.value)} options={subjects.map((s) => ({ value: s, label: s }))} />
          <label className="block text-sm font-semibold text-ink">
            Anything they should know? <span className="font-normal text-subtle">Optional</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="For example: I struggle with calculus and have a test in three weeks."
              className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm font-normal text-ink focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
            />
          </label>
          <Button type="submit" disabled={open >= 3} className="w-full sm:w-auto">
            Send tutor request
          </Button>
          {open >= 3 && <p className="text-xs text-muted">You have three requests waiting. Your sponsor will answer those first.</p>}
        </form>
      ) : (
        <p className="mt-3 text-sm text-body">Add your marks first, then you can ask for a tutor in a specific subject.</p>
      )}

      {requests.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-line pt-3">
          {requests
            .slice()
            .reverse()
            .map((r) => (
              <li key={r.id} className="text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{r.subject}</span>
                  <Badge tone={r.status === 'arranged' ? 'veld' : r.status === 'declined' ? 'neutral' : 'amber'}>
                    {r.status === 'arranged' ? 'Tutor arranged' : r.status === 'declined' ? 'Not this time' : 'Waiting for sponsor'}
                  </Badge>
                </div>
                {r.reply && <p className="mt-0.5 text-body">{r.reply}</p>}
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}

function History({ marks, onRemove }: { marks: MarkRecord[]; onRemove: (id: string) => void }) {
  if (!marks.length) return null;
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="history-heading">
      <h2 id="history-heading" className="text-lg font-semibold">
        Your results so far
      </h2>
      <ul className="mt-3 space-y-3">
        {marks
          .slice()
          .reverse()
          .map((m, i, all) => {
            const avg = averageOf(m.subjects);
            const prev = all[i + 1] ? averageOf(all[i + 1].subjects) : null;
            const change = prev == null ? null : Math.round((avg - prev) * 10) / 10;
            return (
              <li key={m.id} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{m.term}</p>
                    <p className="text-sm text-muted">
                      Average {avg}%
                      {change != null && change !== 0 ? `, ${change > 0 ? 'up' : 'down'} ${Math.abs(change)}` : ''}
                      {m.source === 'report' ? ', read from report' : ''}
                    </p>
                  </div>
                  <button type="button" onClick={() => onRemove(m.id)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink" aria-label={`Remove ${m.term}`}>
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {m.subjects.map((s) => (
                    <li key={s.subject} className={cn('rounded-full px-2.5 py-0.5 text-xs', s.mark < 50 ? 'bg-clay-50 text-clay-700' : 'bg-sunken text-body')}>
                      {s.subject} {s.mark}%
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
