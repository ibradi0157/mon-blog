"use client";
import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={[
        "px-3 py-2 border rounded w-full bg-white dark:bg-slate-800",
        "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100",
        "placeholder:text-slate-500 dark:placeholder:text-slate-400",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    />
  );
});
