import { ReactNode, useEffect, useRef } from 'react';
import { Filter, X } from 'lucide-react';
import { Button, cn } from '@/components/ui/Button';

type FilterPopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount?: number;
  title?: string;
  onReset?: () => void;
  children: ReactNode;
  side?: 'right' | 'left';
  panelWidthClassName?: string;
};

export function FilterPopover({
  open,
  onOpenChange,
  activeCount = 0,
  title = 'Filter',
  onReset,
  children,
  side = 'right',
  panelWidthClassName = 'w-56',
}: FilterPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, onOpenChange]);

  return (
    <div className="relative" ref={rootRef}>
      <Button
        variant="outline"
        size="icon"
        className={cn('h-9 w-9 rounded-xl border-dashed relative', open && 'ring-2 ring-[var(--color-accent-primary)]/30')}
        onClick={() => onOpenChange(!open)}
        title={title}
      >
        <Filter className="h-4 w-4" />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[var(--color-accent-primary)] text-[10px] leading-4 text-white">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          className={cn(
            'absolute top-0 z-30 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)]',
            panelWidthClassName,
            side === 'right' ? 'left-full ml-2' : 'right-full mr-2'
          )}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-subtle)]">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">{title}</span>
            {onReset && (
              <button
                type="button"
                onClick={() => { onReset(); onOpenChange(false); }}
                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
          <div className="p-2">{children}</div>
        </div>
      )}
    </div>
  );
}

