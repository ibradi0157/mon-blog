"use client";
import * as React from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  requiredIndicator?: boolean;
};

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, children, requiredIndicator, ...props },
  ref
) {
  return (
    <label
      ref={ref}
      className={[
        "text-sm font-medium text-slate-700 dark:text-slate-300",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
      {requiredIndicator && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
});
