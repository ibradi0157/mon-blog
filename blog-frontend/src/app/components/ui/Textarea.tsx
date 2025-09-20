"use client";
import * as React from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={[
        "px-3 py-2 border rounded w-full bg-white dark:bg-slate-800",
        "border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100",
        "placeholder:text-slate-500 dark:placeholder:text-slate-400",
        "font-sans",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    />
  );
});
