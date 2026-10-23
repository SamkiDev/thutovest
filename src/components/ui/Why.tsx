import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Collapsed explanation, closed by default. Keeps the reasoning behind
 * predictions and rankings available (Intelligence criterion) without
 * filling a phone screen with text.
 */
export function Why({ children, label = 'Why?', className }: { children: ReactNode; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="-ml-2 inline-flex h-9 items-center gap-1 rounded-full px-2 text-sm font-semibold text-veld-700 hover:text-veld-800"
      >
        {label}
        <ChevronDown aria-hidden className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      <div id={id} hidden={!open} className="mt-1 rounded-xl bg-paper p-3 text-sm text-body">
        {children}
      </div>
    </div>
  );
}
