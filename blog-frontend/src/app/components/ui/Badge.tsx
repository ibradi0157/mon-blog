"use client";
import * as React from "react";

type Variant = "success" | "warning" | "danger" | "neutral" | "muted" | "info" | "outline" | "default" | "secondary" | "destructive";

export function Badge({ children, variant = "neutral", className }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  const base = "inline-flex items-center text-xs px-2 py-0.5 rounded";
  const map: Record<Variant, string> = {
    success: "bg-emerald-600 text-white",
    warning: "bg-amber-600 text-white",
    danger: "bg-rose-600 text-white",
    neutral: "bg-black/10 dark:bg-white/10 text-slate-900 dark:text-slate-100",
    muted: "bg-gray-400 text-white",
    info: "bg-blue-600 text-white",
    outline: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-transparent",
    default: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100",
    secondary: "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100",
    destructive: "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100",
  };
  return <span className={[base, map[variant], className].filter(Boolean).join(" ")}>{children}</span>;
}
