"use client";
import * as React from "react";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={[
        "px-3 py-2 border rounded bg-white dark:bg-slate-800",
        "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </select>
  );
});
