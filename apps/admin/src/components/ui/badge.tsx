import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

const tones = {
  navy: 'bg-navy-50 text-navy',
  teal: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-pending',
  red: 'bg-red-50 text-red-700',
  green: 'bg-emerald-50 text-emerald-700',
  slate: 'bg-slate-100 text-slate-700',
} as const;

export function Badge({
  className,
  tone = 'slate',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function statusTone(status: string): keyof typeof tones {
  const s = status.toUpperCase();
  if (['ACTIVE', 'CONFIRMED', 'PAID', 'COMPLETED'].includes(s)) return 'green';
  if (['PENDING', 'PARTIALLY_PAID', 'PLANNING', 'ON_HOLD'].includes(s)) return 'amber';
  if (['VOIDED', 'REJECTED', 'CANCELLED', 'UNPAID'].includes(s)) return 'red';
  if (['ARCHIVED'].includes(s)) return 'slate';
  return 'navy';
}
