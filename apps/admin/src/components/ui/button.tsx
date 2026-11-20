'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

const variants = {
  primary:
    'bg-navy text-white hover:bg-navy-400 focus-visible:ring-navy disabled:bg-navy-200',
  teal: 'bg-teal text-white hover:bg-teal-600 focus-visible:ring-teal disabled:bg-teal-300',
  outline:
    'border border-surface-border bg-white text-navy hover:bg-surface-muted focus-visible:ring-navy',
  ghost: 'text-navy hover:bg-surface-muted focus-visible:ring-navy',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
  soft: 'bg-teal-50 text-teal-700 hover:bg-teal-100 focus-visible:ring-teal',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
  icon: 'h-10 w-10 p-0',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
