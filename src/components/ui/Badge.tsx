import type { ReactNode } from 'react';
import { OctagonAlert, CircleDot, Clock3, FlaskConical } from 'lucide-react';
import type { Priority, Severity, TaskStatus } from '../../types';
import { PRIORITY_LABEL, SEVERITY_LABEL, TASK_STATUS_LABEL } from '../../data/labels';
import { cn } from '../../utils/cn';

type Tone = 'neutral' | 'veld' | 'amber' | 'clay' | 'ink' | 'outline';

const tones: Record<Tone, string> = {
  neutral: 'bg-sunken text-body',
  veld: 'bg-veld-50 text-veld-700',
  amber: 'bg-amber-50 text-amber-800',
  clay: 'bg-clay-50 text-clay-700',
  ink: 'bg-ink text-white',
  outline: 'border border-line-strong text-muted',
};

export function Badge({ tone = 'neutral', children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold whitespace-nowrap', tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export const SEVERITY_TONE: Record<Severity, Tone> = { urgent: 'clay', soon: 'amber', watch: 'neutral' };

export function SeverityBadge({ severity }: { severity: Severity }) {
  const Icon = severity === 'urgent' ? OctagonAlert : severity === 'soon' ? Clock3 : CircleDot;
  return (
    <Badge tone={SEVERITY_TONE[severity]} icon={<Icon aria-hidden className="size-3.5" />}>
      {SEVERITY_LABEL[severity]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const tone: Tone = status === 'completed' ? 'veld' : status === 'in-progress' ? 'ink' : 'outline';
  return <Badge tone={tone}>{TASK_STATUS_LABEL[status]}</Badge>;
}

export function PriorityDot({ priority }: { priority: Priority }) {
  const color = priority === 'high' ? 'bg-clay-500' : priority === 'medium' ? 'bg-amber-400' : 'bg-ink-300';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span aria-hidden className={cn('size-2 rounded-full', color)} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

/** Marks figures and records that are demonstration data. */
export function DemoTag({ children = 'Demo data', className }: { children?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-dashed border-ink-300 px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted whitespace-nowrap',
        className,
      )}
    >
      <FlaskConical aria-hidden className="size-3" />
      {children}
    </span>
  );
}
