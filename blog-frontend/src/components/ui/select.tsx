import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

type Option = { value: string; label: string };

type SelectContextValue = {
  value?: string;
  onValueChange?: (v: string) => void;
  registerOption: (opt: Option) => void;
  options: Option[];
};

const SelectContext = createContext<SelectContextValue | null>(null);

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) {
  const [options, setOptions] = useState<Option[]>([]);

  // Reset options on mount to avoid duplicates across hot reloads
  useEffect(() => { setOptions([]); }, []);

  const ctx = useMemo<SelectContextValue>(() => ({
    value,
    onValueChange,
    options,
    registerOption: (opt: Option) => {
      setOptions(prev => prev.some(o => o.value === opt.value) ? prev : [...prev, opt]);
    },
  }), [value, onValueChange, options]);

  return (
    <SelectContext.Provider value={ctx}>
      <div className="inline-flex flex-col gap-1">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children }: { className?: string; children?: React.ReactNode }) {
  const ctx = useContext<SelectContextValue | null>(SelectContext);
  if (!ctx) return null;
  const { value, onValueChange, options } = ctx;
  return (
    <div className={cn('relative', className)}>
      <select
        className={cn('w-full h-9 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent text-sm', className)}
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {children}
    </div>
  );
}

export function SelectValue() {
  const ctx = useContext<SelectContextValue | null>(SelectContext);
  if (!ctx) return null;
  const current = ctx.options.find(o => o.value === ctx.value);
  return <span className="sr-only">{current?.label ?? ''}</span>;
}

export function SelectContent({ children }: { children?: React.ReactNode }) {
  // Not needed for native select fallback
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext<SelectContextValue | null>(SelectContext);
  useEffect(() => {
    const label = typeof children === 'string' ? children : (React.Children.map(children, (c) => (typeof c === 'string' ? c : '')) || [''])[0];
    ctx?.registerOption({ value, label: String(label) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  // Render nothing; options are represented in the native select above
  return null;
}
