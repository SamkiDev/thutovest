import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'light' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 select-none whitespace-nowrap';

const variants: Record<Variant, string> = {
  primary: 'bg-veld-600 text-white hover:bg-veld-700 active:bg-veld-800',
  secondary: 'border border-line-strong bg-surface text-ink hover:border-ink-300 hover:bg-ink-100/50',
  ghost: 'text-ink hover:bg-ink-100/70',
  dark: 'bg-ink text-white hover:bg-ink-700',
  light: 'bg-white text-ink hover:bg-veld-50',
  quiet: 'text-veld-700 hover:text-veld-800 hover:underline underline-offset-4 !px-0 !h-auto rounded-md',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[0.9375rem]',
  lg: 'h-13 px-8 text-base',
};

interface Common {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & Common;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
});

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
  ...rest
}: LinkProps & Common) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}
