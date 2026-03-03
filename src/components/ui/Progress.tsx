import { HTMLAttributes, forwardRef } from 'react';
import { cn } from './Button';
import { motion } from 'motion/react';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]',
          className
        )}
        {...props}
      >
        <motion.div
          className={cn(
            'h-full w-full bg-[var(--color-accent-primary)] rounded-full',
            indicatorClassName
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';
