import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none';
    
    const variants: Record<string, string> = {
      default: 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)] hover:bg-[var(--color-accent-primary-hover)]',
      primary: 'bg-[var(--color-accent-primary)] text-[var(--color-accent-primary-text)] hover:bg-[var(--color-accent-primary-hover)]',
      secondary: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-high)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)]',
      ghost: 'text-[var(--color-text-main)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-high)]',
      danger: 'bg-[var(--color-status-danger)] text-white hover:bg-red-600',
      outline: 'border border-[var(--color-border-strong)] text-[var(--color-text-high)] hover:bg-[var(--color-bg-hover)]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-8 text-base',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant] ?? variants.primary, sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
