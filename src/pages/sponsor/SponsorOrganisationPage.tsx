import { useState } from 'react';
import { BadgeCheck, CircleCheck, CircleX, Clock3 } from 'lucide-react';
import type { SponsorCheckKey } from '../../types';
import { useSponsor } from '../../hooks/useSponsor';
import { useToast } from '../../hooks/useToast';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Misc';
import { Button } from '../../components/ui/Button';
import { CheckRunner, type CheckStep } from '../../components/verification/CheckRunner';
import { SPONSOR_CHECKS } from '../../utils/trust';
import { timeAgo } from '../../utils/dates';
import { cn } from '../../utils/cn';

const TYPE_LABEL = { company: 'Company', trust: 'Trust', npo: 'Non-profit organisation' };

function steps(key: SponsorCheckKey, regNo: string): CheckStep[] {
  if (key === 'organisation')
    return [
      { label: `Looking up ${regNo} on the register (simulated)` },
      { label: 'Checking the organisation is active and in good standing', failLabel: 'Registration is deregistered or in final deregistration' },
      { label: 'Matching the organisation name' },
    ];
  if (key === 'representative')
    return [
      { label: 'Reading the representative’s ID document' },
      { label: 'Face match and liveness', failLabel: 'Selfie did not match the ID photo' },
      { label: 'Confirming they are a director or authorised signatory' },
    ];
  return [
    { label: 'Requesting account verification from the bank (simulated)' },
    { label: 'Account holder matches the organisation', failLabel: 'Account holder name does not match the organisation' },
    { label: 'Account is open and can make payments' },
  ];
}

export default function SponsorOrganisationPage() {
  const { sponsor, verified, dispatchPlatform } = useSponsor();
  const notify = useToast();
  const [running, setRunning] = useState<SponsorCheckKey | null>(null);
  useDocumentTitle('Organisation');
  if (!sponsor) return null;
  const current = SPONSOR_CHECKS.find((c) => c.key === running);

  return (
    <div>
      <PageHeader
        title="Organisation & checks"
        description="Students only see sponsors that pass all three checks. It stops fake bursary offers before they reach anyone."
      />
      <section className="card p-5 sm:p-6" aria-labelledby="org-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="org-heading" className="text-2xl font-bold">
              {sponsor.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {TYPE_LABEL[sponsor.type]}, registration {sponsor.registrationNumber}
            </p>
            <p className="mt-3 max-w-xl text-sm text-body">{sponsor.about}</p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold',
              sponsor.status === 'suspended' ? 'bg-clay-50 text-clay-700' : verified ? 'bg-veld-600 text-white' : 'bg-amber-50 text-amber-800',
            )}
          >
            {verified ? <BadgeCheck aria-hidden className="size-4" /> : <Clock3 aria-hidden className="size-4" />}
            {sponsor.status === 'suspended' ? 'Suspended' : verified ? 'Verified sponsor' : 'Checks incomplete'}
          </span>
        </div>
      </section>

      <ul className="mt-5 space-y-3">
        {SPONSOR_CHECKS.map((c) => {
          const item = sponsor.verification[c.key];
          const Icon = item.status === 'verified' ? CircleCheck : item.status === 'failed' ? CircleX : Clock3;
          return (
            <li key={c.key} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', item.status === 'verified' ? 'text-veld-600' : item.status === 'failed' ? 'text-clay-600' : 'text-muted')} />
                <div>
                  <h3 className="font-sans text-[0.9375rem] font-semibold">{c.title}</h3>
                  <p className="text-sm text-muted">{c.detail}</p>
                  {item.updatedAt && (
                    <p className={cn('mt-0.5 text-xs', item.status === 'failed' ? 'font-medium text-clay-600' : 'text-subtle')}>
                      {item.status === 'failed' ? item.note : `${item.status === 'verified' ? 'Verified' : 'Updated'} ${timeAgo(item.updatedAt).toLowerCase()}`}
                    </p>
                  )}
                </div>
              </div>
              {item.status !== 'verified' && sponsor.status === 'active' && (
                <Button size="sm" onClick={() => setRunning(c.key)} className="shrink-0">
                  {item.status === 'failed' ? 'Try again' : 'Run check'}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {current && (
        <CheckRunner
          open
          title={current.title}
          description={current.detail}
          steps={steps(current.key, sponsor.registrationNumber)}
          onClose={() => setRunning(null)}
          onResult={(ok, failed) => {
            dispatchPlatform({ type: 'setSponsorCheck', sponsorId: sponsor.id, key: current.key, item: ok ? { status: 'verified' } : { status: 'failed', note: failed } });
            notify(ok ? `${current.title} verified.` : `${current.title} failed. Students won’t see this organisation until it passes.`, ok ? 'success' : 'info');
          }}
        />
      )}
    </div>
  );
}
