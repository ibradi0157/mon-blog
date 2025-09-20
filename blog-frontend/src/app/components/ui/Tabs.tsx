"use client";
import * as React from "react";

type TabsContextValue = {
  value: string | undefined;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ value, defaultValue, onValueChange, className, children }: TabsProps) {
  const [internal, setInternal] = React.useState<string | undefined>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const setValue = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={["w-full", className].filter(Boolean).join(" ")}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={["inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-md", className].filter(Boolean).join(" ")}>{children}</div>
  );
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx?.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={[
        "px-3 py-1.5 text-sm rounded-md transition-colors",
        isActive
          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow"
          : "text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={className}>{children}</div>;
}
