import { createContext, HTMLAttributes, forwardRef, useState, useCallback, useContext } from 'react';
import { cn } from './Button';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger and TabsContent must be used within Tabs');
  return ctx;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue = '', value: controlledValue, onValueChange, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const handleChange = useCallback(
      (v: string) => {
        if (controlledValue === undefined) setInternalValue(v);
        onValueChange?.(v);
      },
      [controlledValue, onValueChange]
    );
    return (
      <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
        <div ref={ref} className={cn('flex flex-col gap-4', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

export const TabsList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] p-1 text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]',
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  active?: boolean;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, active: _active, onClick, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isActive = selectedValue === value;
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-ring disabled:pointer-events-none disabled:opacity-50',
          isActive
            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-high)] shadow-sm border border-[var(--color-border-strong)]'
            : 'hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-main)]',
          className
        )}
        onClick={(e) => {
          onValueChange(value);
          onClick?.(e);
        }}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  active?: boolean;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, active: _active, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    if (selectedValue !== value) return null;
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn('mt-2 focus-ring', className)}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';
