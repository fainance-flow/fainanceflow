"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@utils/cn";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...rest }, ref) => {
    const reactId = React.useId();
    const checkId = id ?? reactId;
    return (
      <label
        htmlFor={checkId}
        className="inline-flex items-center gap-2 cursor-pointer text-sm text-ink"
      >
        <span className="relative inline-flex">
          <input
            ref={ref}
            id={checkId}
            type="checkbox"
            className={cn(
              "peer h-4 w-4 appearance-none rounded border border-line-strong bg-surface",
              "checked:bg-gold checked:border-gold transition-colors cursor-pointer",
              className
            )}
            {...rest}
          />
          <Check
            className="pointer-events-none absolute left-0 top-0 h-4 w-4 text-canvas opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
          />
        </span>
        {label && <span>{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export default Checkbox;
