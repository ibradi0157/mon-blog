"use client";
import * as React from "react";

export interface SwitchProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { id, checked, defaultChecked, onCheckedChange, disabled, className },
  ref
) {
  const [internal, setInternal] = React.useState<boolean>(!!defaultChecked);
  const isControlled = typeof checked === "boolean";
  const value = isControlled ? (checked as boolean) : internal;

  const toggle = () => {
    const next = !value;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  };

  return (
    <label className={["inline-flex items-center cursor-pointer select-none", disabled ? "opacity-60 cursor-not-allowed" : "", className].filter(Boolean).join(" ")}
      htmlFor={id}
    >
      <input
        id={id}
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        checked={value}
        disabled={disabled}
        onChange={() => toggle()}
      />
      <div className="w-10 h-6 bg-slate-300 dark:bg-slate-700 rounded-full relative transition-colors peer-checked:bg-blue-600">
        <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-200 shadow transition-all peer-checked:left-[1.375rem]"></div>
      </div>
    </label>
  );
});
