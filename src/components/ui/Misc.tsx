import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center', className)}>
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-veld-50 text-veld-600">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  kicker,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  kicker?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {kicker && <div className="mb-2">{kicker}</div>}
        <h1 className="text-[1.75rem] leading-tight font-bold sm:text-[2.125rem]">{title}</h1>
        {description && <p className="mt-2 text-[0.9375rem] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ title, description, action, id }: { title: string; description?: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn('inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent', className)} />
  );
}
