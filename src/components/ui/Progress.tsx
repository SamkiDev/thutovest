import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function ProgressBar({
  value,
  label,
  className,
  tone = 'veld',
  size = 'md',
}: {
  value: number;
  label: string;
  className?: string;
  tone?: 'veld' | 'ink' | 'amber' | 'light';
  size?: 'sm' | 'md';
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const fill = { veld: 'bg-veld-500', ink: 'bg-ink', amber: 'bg-amber-400', light: 'bg-veld-300' }[tone];
  const track = tone === 'light' ? 'bg-white/15' : 'bg-sunken';
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('w-full overflow-hidden rounded-full', track, size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  label,
  dark = false,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  dark?: boolean;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={dark ? 'stroke-white/15' : 'stroke-sunken'} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', dark ? 'stroke-veld-300' : 'stroke-veld-500')}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
