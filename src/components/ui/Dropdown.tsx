import React, { useState, useRef, useEffect } from 'react';
import { cn } from './Button';

type DropdownItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  separator?: boolean;
};

type DropdownProps = {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
};

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleItemClick = (item: DropdownItem) => {
    item.onClick();
    setOpen(false);
  };

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      
      {open && (
        <div
          className={cn(
            'absolute top-full mt-1 z-[100] min-w-[160px] max-h-[300px] overflow-y-auto rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] shadow-lg',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {item.separator && index > 0 && (
                  <div className="h-px bg-[var(--color-border-subtle)] my-1" />
                )}
                <button
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors whitespace-nowrap',
                    item.variant === 'danger'
                      ? 'text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger)]/10'
                      : 'text-[var(--color-text-high)] hover:bg-[var(--color-bg-hover)]'
                  )}
                >
                  {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
