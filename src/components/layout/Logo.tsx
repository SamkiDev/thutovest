import { BRAND } from '../../config/brand';
import { cn } from '../../utils/cn';

export function LogoMark({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill={dark ? '#ffffff' : '#0D1B3E'} />
      <path d="M8 23c4 0 4-7 8-7s4-7 8-7" fill="none" stroke="#26A57C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="8" cy="23" r="2.6" fill={dark ? '#0D1B3E' : '#ffffff'} />
      <circle cx="24" cy="9" r="2.6" fill="#26A57C" />
    </svg>
  );
}

/**
 * The brand's route motif at icon size: a start node, the route, an end node.
 * Marks the assistant and "next step" moments instead of a generic sparkle.
 * Inherits colour from `currentColor`.
 */
export function RouteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn('size-5', className)} aria-hidden fill="none">
      <path d="M4.5 15.5c3 0 3-5.5 5.5-5.5s2.5-5.5 5.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4.5" cy="15.5" r="2.25" fill="currentColor" />
      <circle cx="15.5" cy="4.5" r="2.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark dark={dark} />
      <span className={cn('font-display text-[1.25rem] font-bold tracking-tight', dark ? 'text-white' : 'text-ink')}>
        {BRAND.wordmark[0]}
        <span className={dark ? 'text-veld-300' : 'text-veld-600'}>{BRAND.wordmark[1]}</span>
      </span>
    </span>
  );
}
