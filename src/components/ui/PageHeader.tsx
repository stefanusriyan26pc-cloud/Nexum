import { ReactNode } from 'react';
import { cn } from '@/components/ui/Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Consistent page header: title, optional description, optional action buttons. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight text-[var(--color-text-high)]">
          {title}
        </h1>
        {description && (
          <p className="text-[var(--color-text-muted)] mt-0.5 text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
