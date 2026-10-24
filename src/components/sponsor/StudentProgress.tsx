import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, ShieldAlert, UserRoundPlus } from 'lucide-react';
import type { CandidateProfile, Fund, FundApplication } from '../../types';
import type { PlatformAction } from '../../platform/platformReducer';
import { analyseResults, isFunded, STATUS_LABEL, warningText, type ProgressStatus } from '../../platform/progressRules';
import { institutionById } from '../../data/institutions';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Why } from '../ui/Why';
import { formatZAR } from '../../utils/format';
import { formatDate } from '../../utils/dates';
import { cn } from '../../utils/cn';

const STATUS_TONE: Record<ProgressStatus, 'veld' | 'amber' | 'clay'> = { 'on-track': 'veld', watch: 'amber', 'at-risk': 'clay' };
const ORDER: Record<ProgressStatus, number> = { 'at-risk': 0, watch: 1, 'on-track': 2 };

/**
 * The students this sponsor funds, read from the term averages they share.
 * Slipping students come first, with an early warning the platform words
 * fairly, and tutor requests to answer.
 */
export function StudentProgress({
  sponsorName,
  applications,
  funds,
  candidateById,
  dispatch,
}: {
  sponsorName: string;
  applications: FundApplication[];
  funds: Fund[];
  candidateById: (id: string) => CandidateProfile | undefined;
  dispatch: (a: PlatformAction) => void;
}) {
  const [warnFor, setWarnFor] = useState<FundApplication | null>(null);
  const [note, setNote] = useState('');
  const rows = applications
    .filter(isFunded)
    .map((app) => {
      const fund = funds.find((f) => f.id === app.fundId);
      const c = candidateById(app.studentId);
      return { app, fund, c, a: analyseResults(c?.results ?? [], fund?.terms?.minPassMark) };
    })
    .sort((x, y) => (x.a.latest && y.a.latest ? ORDER[x.a.status] - ORDER[y.a.status] : x.a.latest ? -1 : 1));

  const warnRow = rows.find((r) => r.app.id === warnFor?.id);

  return (
    <section id="impact" tabIndex={-1} className="card scroll-mt-20 p-5 outline-none sm:p-6" aria-labelledby="impact-heading">
      <h2 id="impact-heading" className="text-lg font-semibold">
        Student progress
      </h2>
      <p className="mt-0.5 text-sm text-muted">Marks from the students you fund, read as soon as they add them.</p>
      <ul className="mt-3 divide-y divide-line">
        {rows.map(({ app, fund, c, a }) => {
          const Arrow = a.change == null || a.change === 0 ? Minus : a.change > 0 ? ArrowUpRight : ArrowDownRight;
          const open = (app.tutorRequests ?? []).filter((r) => r.status === 'requested');
          const lastWarning = app.warnings?.at(-1);
          return (
            <li key={app.id} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-ink">
                  {c?.firstName ?? 'Student'}
                  <span className="ml-1.5 text-sm font-normal text-muted">{institutionById(c?.institutionId ?? '')?.shortName}</span>
                </p>
                {a.latest ? <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge> : <span className="num text-sm text-muted">{formatZAR(app.amount ?? 0)}</span>}
              </div>
              <p className="text-xs text-muted">
                {fund?.name}
                {fund?.terms?.minPassMark ? `, pass mark ${fund.terms.minPassMark}%` : ''}
              </p>

              {a.latest ? (
                <>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-body">
                    <span>
                      {a.latest.term}: <strong className="text-ink">{a.latest.average}%</strong>
                    </span>
                    {a.change != null && (
                      <span className={cn('inline-flex items-center gap-0.5', a.change < 0 ? 'text-clay-700' : 'text-veld-700')}>
                        <Arrow aria-hidden className="size-4" />
                        {a.change > 0 ? '+' : ''}
                        {a.change} since {a.previous?.term}
                      </span>
                    )}
                  </p>
                  {a.latest.subjects && a.latest.subjects.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`${c?.firstName ?? 'Student'}’s marks for ${a.latest.term}`}>
                      {[...a.latest.subjects]
                        .sort((x, y) => x.mark - y.mark)
                        .map((s) => (
                          <li key={s.subject} className={cn('rounded-full px-2.5 py-0.5 text-xs', s.mark < 50 ? 'bg-clay-50 text-clay-700' : 'bg-sunken text-body')}>
                            {s.subject} {s.mark}%
                          </li>
                        ))}
                    </ul>
                  )}
                  {a.reasons.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-sm text-body">
                      {a.reasons.map((r) => (
                        <li key={r} className="flex items-start gap-1.5">
                          <ShieldAlert aria-hidden className={cn('mt-0.5 size-4 shrink-0', a.status === 'at-risk' ? 'text-clay-600' : 'text-amber-700')} />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                  {a.status !== 'on-track' && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setWarnFor(app)}>
                        {lastWarning ? 'Send another warning' : 'Send early warning'}
                      </Button>
                      {lastWarning && <span className="text-xs text-muted">Warned {formatDate(lastWarning.at.slice(0, 10))}</span>}
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-1.5 text-sm text-muted">No marks shared yet. They appear here as soon as {c?.firstName ?? 'the student'} adds some.</p>
              )}

              {open.map((r) => (
                <TutorRequestRow
                  key={r.id}
                  subject={r.subject}
                  note={r.note}
                  at={r.at}
                  onAnswer={(arranged, reply) => dispatch({ type: 'answerTutor', applicationId: app.id, requestId: r.id, arranged, note: reply })}
                />
              ))}
            </li>
          );
        })}
        {rows.length === 0 && <li className="py-3 text-sm text-muted">Students you fund appear here, with their results as they come in.</li>}
      </ul>
      <Why className="mt-2">
        Students share their marks for every subject or module with the sponsor funding them, as their bursary agreement asks, and with nobody else. Below your fund’s pass mark, a module under 40%, or fewer than half the credits passed, is at risk. A drop of 5 points or more is worth watching.
      </Why>

      <Modal
        open={Boolean(warnRow?.a.latest)}
        onClose={() => {
          setWarnFor(null);
          setNote('');
        }}
        title={`Early warning to ${warnRow?.c?.firstName ?? 'the student'}`}
        description="ThutoVest writes the warning so it is clear and fair: it states the requirement, says no decision has been made, and offers help."
        footer={
          <>
            <Button variant="secondary" onClick={() => setWarnFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (warnRow) dispatch({ type: 'sendProgressWarning', applicationId: warnRow.app.id, note: note.trim() });
                setWarnFor(null);
                setNote('');
              }}
            >
              Send warning
            </Button>
          </>
        }
      >
        {warnRow?.a.latest && (
          <div className="space-y-3">
            <blockquote className="rounded-xl bg-sunken p-3 text-sm text-body">
              {warningText(sponsorName, warnRow.fund?.name ?? 'bursary', warnRow.a.latest, warnRow.fund?.terms?.minPassMark, note.trim())}
            </blockquote>
            <label className="block text-sm font-semibold text-ink">
              Add a personal note <span className="font-normal text-subtle">Optional</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="For example: We believe in you. Let’s talk this week."
                className="mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm font-normal text-ink focus:border-veld-500 focus:ring-3 focus:ring-veld-100 focus:outline-none"
              />
            </label>
          </div>
        )}
      </Modal>
    </section>
  );
}

function TutorRequestRow({ subject, note, at, onAnswer }: { subject: string; note: string; at: string; onAnswer: (arranged: boolean, reply: string) => void }) {
  const [reply, setReply] = useState('');
  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
        <UserRoundPlus aria-hidden className="size-4" /> Tutor request: {subject}
      </p>
      {note && <p className="mt-0.5 text-sm text-amber-900">“{note}”</p>}
      <p className="text-xs text-amber-800">{formatDate(at.slice(0, 10))}</p>
      <input
        aria-label={`Reply about the ${subject} tutor`}
        value={reply}
        onChange={(e) => setReply(e.target.value.slice(0, 500))}
        placeholder="Optional reply, for example when the tutor starts"
        className="mt-2 h-10 w-full rounded-lg border border-amber-200 bg-surface px-3 text-sm text-ink focus:border-veld-500 focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onAnswer(true, reply.trim())}>
          Arrange tutor
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onAnswer(false, reply.trim())}>
          Not now
        </Button>
      </div>
    </div>
  );
}
