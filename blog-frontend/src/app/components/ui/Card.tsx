"use client";
import * as React from "react";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={["border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700", className].filter(Boolean).join(" ")}>{children}</div>
  );
}
