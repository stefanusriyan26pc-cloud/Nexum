import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from './Button';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[var(--color-text-main)]">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-text-high)] transition-colors',
            'placeholder:text-[var(--color-text-muted)]',
            'focus-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--color-status-danger)] focus:ring-[var(--color-status-danger)]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[var(--color-status-danger)] mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
