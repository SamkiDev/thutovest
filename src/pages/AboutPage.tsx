import { PublicFooter, PublicHeader } from '../components/layout/PublicChrome';
import { ButtonLink } from '../components/ui/Button';
import { BRAND } from '../config/brand';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PRINCIPLES = [
  { title: 'Verified on both sides', body: 'Students pass identity checks. Sponsors pass registration, identity and bank checks.' },
  { title: 'Money goes to the institution', body: 'Awards go into the student’s fee account. Nobody can charge a student to receive funding.' },
  { title: 'Scam messages blocked', body: 'Requests for fees or bank details are blocked and the sender suspended.' },
  { title: 'Under-18s are protected', body: 'A guardian gives consent and co-signs before any sponsor can make contact.' },
  { title: 'Demo data is labelled', body: 'Fees, APS guides, deadlines and some funding records are demonstration figures.' },
];

const PROBLEM = [
  'Students piece a plan together from NSFAS, university sites and WhatsApp groups.',
  'They miss deadlines because nothing warns them in time.',
  'Sponsors want to fund students but struggle to find them.',
  'Students can’t tell real bursary offers from scams.',
];

const REVENUE = [
  'Free for students, always',
  'A small administration fee on awards paid through the platform',
  'Sponsor impact and skills-development reports',
  'Cohort insights for institutions and schools',
];

/** Background for judges and curious visitors, moved off the landing page to keep it short. */
export default function AboutPage() {
  useDocumentTitle('About');
  return (
    <div className="bg-paper">
      <PublicHeader />
      <main id="top" tabIndex={-1} className="outline-none">
        <section className="mx-auto max-w-[76rem] px-4 pt-12 pb-16 sm:px-6 lg:px-10 lg:pt-16">
          <h1 className="text-[2.25rem] leading-tight font-bold sm:text-[2.75rem]">Honest about what it is</h1>
          <p className="mt-4 max-w-2xl text-body">
            Built for the FNB App of the Year Hackathon 2026, Access to Higher Education. {BRAND.name} plans, predicts and connects. It doesn’t award bursaries or
            decide admissions.
          </p>

          <h2 className="mt-10 font-sans text-lg font-semibold text-ink">The problem</h2>
          <ul className="mt-3 max-w-2xl space-y-2 text-body">
            {PROBLEM.map((p) => (
              <li key={p} className="flex gap-3">
                <span aria-hidden className="route-bullet" />
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div className="rounded-2xl bg-surface p-6">
              <h2 className="font-sans text-lg font-semibold text-ink">Business model</h2>
              <ul className="mt-3 space-y-2 text-body">
                {REVENUE.map((r) => (
                  <li key={r} className="flex gap-3">
                    <span aria-hidden className="route-bullet" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <ul className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <li key={p.title} className="bg-surface p-6">
                  <h2 className="font-sans text-lg font-semibold text-ink">{p.title}</h2>
                  <p className="mt-1.5 text-sm text-muted">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink to="/start">Build my plan</ButtonLink>
            <ButtonLink to="/signin" variant="secondary">
              Try the demo
            </ButtonLink>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
