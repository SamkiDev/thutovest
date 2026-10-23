import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, ChartLine, GraduationCap, MousePointerClick } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RouteMark } from '../../components/layout/Logo';
import { useSponsor } from '../../hooks/useSponsor';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Misc';
import { DemoTag } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import type { SponsorInsight } from '../../intelligence/sponsorInsights';
import { formatZAR, percent } from '../../utils/format';
import { timeAgo } from '../../utils/dates';
import { institutionById } from '../../data/institutions';
import { cn } from '../../utils/cn';

const STAGES = [
  { key: 'interested', label: 'Shared profile' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'offered', label: 'Offer sent' },
  { key: 'accepted', label: 'Signed, documents' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
] as const;

const TONE_ICON: Record<SponsorInsight['tone'], LucideIcon> = {
  learned: Brain,
  forecast: ChartLine,
  action: MousePointerClick,
  impact: GraduationCap,
};

export default function SponsorOverviewPage() {
  const { sponsor, funds, applications, brief, platform, candidateById } = useSponsor();
  const location = useLocation();
  useDocumentTitle('Sponsor overview');

  useEffect(() => {
    if (location.hash === '#impact') requestAnimationFrame(() => document.getElementById('impact')?.scrollIntoView({ block: 'start' }));
  }, [location.hash]);

  if (!sponsor || !brief) return null;
  const budget = funds.reduce((s, f) => s + f.budget, 0);
  const committed = applications.filter((a) => ['offered', 'accepted', 'approved', 'paid'].includes(a.status)).reduce((s, a) => s + (a.amount ?? 0), 0);
  const paid = applications.filter((a) => a.status === 'paid');
  const paidTotal = paid.reduce((s, a) => s + (a.amount ?? 0), 0);
  const awaiting = applications.filter((a) => a.status === 'offered').length;
  const funded = applications.filter((a) => a.status === 'accepted' || a.status === 'approved' || a.status === 'paid').length;
  const events = platform.events.filter((e) => (e.audience === 'sponsor' || e.audience === 'all') && e.sponsorId === sponsor.id).slice(0, 6);

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${sponsor.contactName}`}
        description="Your funds, waiting students and what the assistant noticed."
        kicker={<DemoTag>Demo sponsor and students</DemoTag>}
        actions={<ButtonLink to="/sponsor/candidates">Review candidates</ButtonLink>}
      />

      <section aria-label="Key figures" className="overflow-hidden rounded-[1.5rem] bg-ink-900 text-white">
        <dl className="grid grid-cols-2 divide-white/10 lg:grid-cols-4 lg:divide-x">
          <Kpi label="Committed" value={formatZAR(committed)} sub={`of ${formatZAR(budget)} budget (${percent(budget ? committed / budget : 0)})`} />
          <Kpi label="Students funded" value={String(funded)} sub={`${awaiting} ${awaiting === 1 ? 'offer' : 'offers'} awaiting a reply`} />
          <Kpi label="Paid to institutions" value={formatZAR(paidTotal)} sub="Never paid to students directly" />
          <Kpi label="Possible skills development spend" value={formatZAR(paidTotal)} sub="Estimate only. Confirm with your B-BBEE verification agency" />
        </dl>
        <div className="border-t border-white/10 px-5 py-4 sm:px-8">
          <p className="mb-2 text-xs font-semibold text-white/60">Pipeline across your funds</p>
          <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-6" aria-label="Pipeline">
            {STAGES.map((s) => {
              const n = applications.filter((a) => a.status === s.key).length;
              return (
                <li key={s.key} className="rounded-xl bg-white/5 px-2 py-3 text-center">
                  <span className="num block font-display text-2xl font-bold">{n}</span>
                  <span className="block text-[0.6875rem] text-white/65 sm:text-xs">{s.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <section className="card p-5 sm:p-6" aria-labelledby="ins-heading">
          <h2 id="ins-heading" className="flex items-center gap-2 text-lg font-semibold">
            <RouteMark className="size-5 text-veld-600" /> Assistant insights
          </h2>
          <p className="mt-0.5 text-sm text-muted">Forecasts and patterns from your funds and your own decisions.</p>
          <ul className="mt-4 space-y-3">
            {brief.insights.map((i) => {
              const Icon = TONE_ICON[i.tone];
              return (
                <li key={i.id} className="rounded-2xl border border-line p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'grid size-9 shrink-0 place-items-center rounded-xl',
                        i.tone === 'action' && 'bg-amber-50 text-amber-700',
                        i.tone === 'forecast' && 'bg-ink-100 text-ink',
                        i.tone === 'learned' && 'bg-veld-50 text-veld-700',
                        i.tone === 'impact' && 'bg-veld-50 text-veld-700',
                      )}
                    >
                      <Icon aria-hidden className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{i.title}</p>
                      <p className="mt-0.5 text-sm text-body">{i.detail}</p>
                      {i.evidence.length > 0 && (
                        <details className="mt-1.5 text-xs text-muted">
                          <summary className="cursor-pointer font-semibold text-veld-700">What this is based on</summary>
                          <ul className="mt-1 space-y-0.5">
                            {i.evidence.map((e) => (
                              <li key={e}>• {e}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {i.link && (
                        <Link to={i.link.to} className="mt-2 inline-block text-sm font-semibold text-veld-700 hover:underline underline-offset-4">
                          {i.link.label}
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-5">
          <section className="card p-5 sm:p-6" aria-labelledby="act-heading">
            <h2 id="act-heading" className="text-lg font-semibold">
              Recent activity
            </h2>
            <ol className="mt-3 space-y-3">
              {events.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="text-body">{e.text}</p>
                  <p className="text-xs text-subtle">{timeAgo(e.at)}</p>
                </li>
              ))}
              {events.length === 0 && <li className="text-sm text-muted">Nothing yet. Publish a fund to start receiving matches.</li>}
            </ol>
          </section>

          <section id="impact" tabIndex={-1} className="card scroll-mt-20 p-5 outline-none sm:p-6" aria-labelledby="impact-heading">
            <h2 id="impact-heading" className="text-lg font-semibold">
              Impact
            </h2>
            <p className="mt-0.5 text-sm text-muted">Verified results from students you’ve funded.</p>
            <ul className="mt-3 divide-y divide-line">
              {paid.map((a) => {
                const c = candidateById(a.studentId);
                const r = c?.results?.[c.results.length - 1];
                return (
                  <li key={a.id} className="py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-ink">
                        {c?.firstName}
                        <span className="ml-1.5 text-sm font-normal text-muted">{institutionById(c?.institutionId ?? '')?.shortName}</span>
                      </p>
                      <span className="num text-sm text-muted">{formatZAR(a.amount ?? 0)}</span>
                    </div>
                    {r ? (
                      <p className="mt-0.5 text-sm text-body">
                        {r.term}: average {r.average}%, {r.creditsPassed} of {r.creditsTaken} credits passed
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted">First results due after the June exams</p>
                    )}
                  </li>
                );
              })}
              {paid.length === 0 && <li className="py-3 text-sm text-muted">Results appear here once a funded student finishes a semester.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border-white/10 p-5 even:border-l sm:px-8 lg:border-l-0 [&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0">
      <dt className="text-xs text-white/60">{label}</dt>
      <dd className="num mt-1 font-display text-2xl font-bold sm:text-[1.75rem]">{value}</dd>
      <p className="mt-0.5 text-xs text-white/55">{sub}</p>
    </div>
  );
}
