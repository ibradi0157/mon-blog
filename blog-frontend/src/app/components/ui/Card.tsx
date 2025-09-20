"use client";
import * as React from "react";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={["border rounded bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700", className].filter(Boolean).join(" ")}>{children}</div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={["flex flex-col space-y-1.5 p-6", className].filter(Boolean).join(" ")}>{children}</div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={["text-2xl font-semibold leading-none tracking-tight", className].filter(Boolean).join(" ")}>{children}</h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={["text-sm text-muted-foreground", className].filter(Boolean).join(" ")}>{children}</p>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={["p-6 pt-0", className].filter(Boolean).join(" ")}>{children}</div>
  );
}
