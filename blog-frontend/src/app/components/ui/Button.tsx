"use client";
import * as React from "react";

type Variant = "primary" | "secondary" | "danger" | "warning" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({ variant = "secondary", size = "md", className, disabled, children, ...rest }: ButtonProps) {
  const base = "inline-flex items-center gap-2 rounded transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes: Record<Size, string> = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };
  const variants: Record<Variant, string> = {
    primary: "bg-blue-600 text-white hover:opacity-90",
    secondary: "border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700",
    danger: "bg-rose-600 text-white hover:opacity-90",
    warning: "bg-amber-600 text-white hover:opacity-90",
    outline: "border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700",
    ghost: "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700",
  };

  return (
    <button type={rest.type ?? "button"} {...rest} disabled={disabled} className={cx(base, sizes[size], variants[variant], className)}>
      {children}
    </button>
  );
}
