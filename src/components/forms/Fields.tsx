import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { CircleAlert, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { parseMoney } from '../../utils/format';

const inputBase =
  'w-full rounded-xl border bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-subtle transition-colors focus:border-veld-500 focus:outline-none focus:ring-3 focus:ring-veld-100 disabled:bg-sunken';

export function FieldShell({
  label,
  hint,
  error,
  htmlFor,
  hintId,
  errorId,
  children,
  optional,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  htmlFor: string;
  hintId: string;
  errorId: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-subtle">Optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-clay-600">
          <CircleAlert aria-hidden className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
};

export function TextField({ label, hint, error, optional, className, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id} hintId={`${id}-h`} errorId={`${id}-e`} optional={optional}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
        className={cn(inputBase, 'h-12', error ? 'border-clay-500' : 'border-line-strong', className)}
        {...rest}
      />
    </FieldShell>
  );
}

/** Rand input: plain digits while editing, R12,500 formatting when not focused. */
export function MoneyInput({
  value,
  onChange,
  label,
  id: idProp,
  className,
  size = 'md',
  describedBy,
  invalid,
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  id?: string;
  className?: string;
  size?: 'sm' | 'md';
  describedBy?: string;
  invalid?: boolean;
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const display = focused ? draft : value ? value.toLocaleString('en-ZA').replace(/[\s  ]/g, ',') : '0';
  return (
    <div className={cn('relative', className)}>
      <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[0.9375rem] font-semibold text-muted">
        R
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={display}
        onFocus={(e) => {
          setDraft(value ? String(value) : '');
          setFocused(true);
          requestAnimationFrame(() => e.target.select());
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
          setDraft(cleaned);
          onChange(parseMoney(cleaned));
        }}
        className={cn(inputBase, 'num pl-8 font-semibold', size === 'sm' ? 'h-10' : 'h-12', invalid ? 'border-clay-500' : 'border-line-strong')}
      />
    </div>
  );
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  options: { value: string; label: string }[];
};

export function SelectField({ label, hint, error, options, className, ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id} hintId={`${id}-h`} errorId={`${id}-e`}>
      <select
        id={id}
        aria-describedby={hint ? `${id}-h` : undefined}
        className={cn(inputBase, 'h-12 appearance-none border-line-strong bg-[length:1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23586582' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
}

/** Radio group rendered as selectable cards. */
export function ChoiceCards<T extends string>({
  legend,
  options,
  value,
  onChange,
  columns = 2,
  error,
  description,
}: {
  legend: string;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4 | 5;
  error?: string;
  description?: ReactNode;
}) {
  const name = useId();
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4', 5: 'sm:grid-cols-3 lg:grid-cols-5' }[columns];
  return (
    <fieldset aria-invalid={error ? true : undefined}>
      <legend className="mb-1.5 text-sm font-semibold text-ink">{legend}</legend>
      {description && <p className="-mt-0.5 mb-3 text-xs text-muted">{description}</p>}
      <div className={cn('grid grid-cols-1 gap-3', cols)}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                'group relative flex cursor-pointer items-start gap-3 rounded-xl border bg-surface p-4 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-veld-200',
                checked ? 'border-veld-500 bg-veld-50/60 shadow-[inset_0_0_0_1px_var(--color-veld-500)]' : 'border-line-strong hover:border-ink-300',
              )}
            >
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="sr-only" />
              {o.icon && <span className={cn('mt-0.5 shrink-0', checked ? 'text-veld-600' : 'text-muted')}>{o.icon}</span>}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{o.label}</span>
                {o.hint && <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>}
              </span>
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
                  checked ? 'border-veld-600 bg-veld-600 text-white' : 'border-line-strong',
                )}
              >
                {checked && <Check className="size-3" strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-clay-600">
          <CircleAlert aria-hidden className="size-3.5" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Toggle chips — multi-select (checkbox semantics) or single (radio semantics). */
export function ChipGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
  multiple = false,
  description,
  error,
  hideLegend,
}: {
  legend: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  multiple?: boolean;
  description?: ReactNode;
  error?: string;
  hideLegend?: boolean;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className={cn('mb-1.5 text-sm font-semibold text-ink', hideLegend && 'sr-only')}>{legend}</legend>
      {description && <p className="-mt-0.5 mb-3 text-xs text-muted">{description}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <label
              key={o.value}
              className={cn(
                'relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-veld-200',
                on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-body hover:border-ink-300',
              )}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                checked={on}
                onChange={() => onToggle(o.value)}
                className="sr-only"
              />
              {on && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
              {o.label}
            </label>
          );
        })}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-clay-600">
          <CircleAlert aria-hidden className="size-3.5" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
