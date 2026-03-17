'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type TabsContextType = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextType | null>(null);

export function Tabs({ value, defaultValue, onValueChange, className, children }: {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const activeValue = value ?? internalValue;
  const setValue = (nextValue: string) => {
    if (!value) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('inline-flex h-10 items-center rounded-md bg-muted p-1', className)} {...props} />;
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const context = React.useContext(TabsContext);
  if (!context) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => context.setValue(value)}
      className={cn(
        'inline-flex items-center rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
        context.value === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const context = React.useContext(TabsContext);
  if (!context || context.value !== value) {
    return null;
  }
  return <div className={cn('mt-4', className)}>{children}</div>;
}
