import { HTMLAttributes, forwardRef } from 'react';
import { cn } from './Button';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'planning' | 'outline';
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] border border-[var(--color-border-subtle)]',
      success: 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]',
      warning: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]',
      danger: 'bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger)]',
      info: 'bg-[var(--color-status-info-bg)] text-[var(--color-status-info)]',
      planning: 'bg-[var(--color-status-planning-bg)] text-[var(--color-status-planning)]',
      outline: 'text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
