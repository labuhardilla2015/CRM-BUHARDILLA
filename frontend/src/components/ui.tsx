import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

/** Botón base reutilizable (estilo shadcn simplificado). */
export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }
>(({ className, variant = 'primary', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none',
      variant === 'primary' && 'bg-brand text-white hover:bg-brand-dark',
      variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
      className,
    )}
    {...props}
  />
));
Button.displayName = 'Button';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none',
        'focus:border-brand focus:ring-2 focus:ring-brand/20',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1 block text-sm font-medium text-slate-700', className)} {...props} />;
}
