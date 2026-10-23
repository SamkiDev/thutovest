import { BadgeCheck, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { StudentCheckKey, TrustLevel, VerificationStatus } from '../../types';
import { TRUST_LABEL } from '../../utils/trust';
import { cn } from '../../utils/cn';

export function TrustBadge({ level, className, dark = false }: { level: TrustLevel; className?: string; dark?: boolean }) {
  const Icon = level === 0 ? ShieldAlert : level === 3 ? BadgeCheck : ShieldCheck;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold whitespace-nowrap',
        dark
          ? level === 0
            ? 'bg-white/10 text-white/80'
            : 'bg-veld-300/20 text-veld-200'
          : level === 0
            ? 'bg-sunken text-muted'
            : level === 3
              ? 'bg-veld-600 text-white'
              : 'bg-veld-50 text-veld-700',
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {TRUST_LABEL[level]}
    </span>
  );
}

const CHECK_SHORT: Record<StudentCheckKey, string> = {
  identity: 'ID',
  enrolment: 'Offer',
  results: 'Results',
  income: 'Income',
  guardian: 'Guardian',
};

export function CheckChips({ checks, isAdult }: { checks: Record<StudentCheckKey, VerificationStatus>; isAdult: boolean }) {
  const keys = (Object.keys(CHECK_SHORT) as StudentCheckKey[]).filter((k) => k !== 'guardian' || !isAdult);
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Verification checks">
      {keys.map((k) => {
        const ok = checks[k] === 'verified';
        return (
          <li
            key={k}
            className={cn('rounded-md px-1.5 py-0.5 text-[0.6875rem] font-semibold', ok ? 'bg-veld-50 text-veld-700' : 'bg-sunken text-subtle line-through')}
          >
            {CHECK_SHORT[k]}
            <span className="sr-only">{ok ? ' verified' : ' not verified'}</span>
          </li>
        );
      })}
    </ul>
  );
}
