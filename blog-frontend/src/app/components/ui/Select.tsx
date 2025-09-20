"use client";
import * as React from "react";

type Option = { value: string; label: React.ReactNode };

type SelectContextValue = {
  value?: string;
  setValue: (v: string) => void;
  options: Option[];
  registerOption: (opt: Option) => void;
  placeholder?: string;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

export interface SelectRootProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Select({ value, defaultValue, onValueChange, onChange, disabled, children, className }: SelectRootProps) {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);
  const [options, setOptions] = React.useState<Option[]>([]);

  const currentValue = value !== undefined ? value : internalValue;

  const setValue = (v: string) => {
    if (onValueChange) onValueChange(v);
    if (value === undefined) setInternalValue(v);
  };

  const registerOption = React.useCallback((opt: Option) => {
    setOptions((prev) => {
      if (prev.find((o) => o.value === opt.value)) return prev;
      return [...prev, opt];
    });
  }, []);

  // If onChange is provided or raw <option> children are used, render a native <select>
  const childrenArray = React.Children.toArray(children);
  const hasNativeOptions = childrenArray.some(
    (child) => React.isValidElement(child) && (child.type as any) === 'option'
  );

  if (onChange || hasNativeOptions) {
    return (
      <select
        className={[
          "px-3 py-2 border rounded bg-white dark:bg-slate-800",
          "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100",
          disabled ? "opacity-60 cursor-not-allowed" : "",
          className,
        ].filter(Boolean).join(" ")}
        value={currentValue}
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e);
        }}
        disabled={disabled}
      >
        {children}
      </select>
    );
  }

  return (
    <SelectContext.Provider value={{ value: currentValue, setValue, options, registerOption }}>
      <div className={["relative", className].filter(Boolean).join(" ")}>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className }: { children?: React.ReactNode; className?: string }) {
  // Simple visual wrapper; actual interaction handled by native select rendered in Content
  return (
    <button
      type="button"
      className={[
        "w-full text-left px-3 py-2 border rounded bg-white dark:bg-slate-800",
        "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext);
  const label = React.useMemo(() => {
    if (!ctx) return placeholder || null;
    const opt = ctx.options.find((o) => o.value === ctx.value);
    return opt ? opt.label : placeholder || null;
  }, [ctx?.options, ctx?.value, placeholder]);
  return <span className="text-slate-700 dark:text-slate-300 text-sm">{label}</span>;
}

export function SelectContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  const ctx = React.useContext(SelectContext);
  // Render an actual native select to ensure accessibility and form behavior
  if (!ctx) return null;
  return (
    <select
      className={[
        "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
        className,
      ].filter(Boolean).join(" ")}
      value={ctx.value}
      onChange={(e) => ctx.setValue(e.target.value)}
    >
      {/* Render options collected from SelectItem registrations */}
      {ctx.options.map((o) => (
        <option key={o.value} value={o.value}>
          {typeof o.label === 'string' ? o.label : ''}
        </option>
      ))}
    </select>
  );
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(SelectContext);
  React.useEffect(() => {
    if (ctx) ctx.registerOption({ value, label: children });
  }, [ctx, value, children]);
  // Does not render by itself; options are rendered by native select
  return null;
}
