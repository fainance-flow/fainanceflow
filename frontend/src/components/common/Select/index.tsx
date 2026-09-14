"use client";

import * as React from "react";
import { cn } from "@utils/cn";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: SelectOption[];
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, id, ...rest }, ref) => {
    const reactId = React.useId();
    const selectId = id ?? reactId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            // 16px, not a rem-based text-base/text-sm token — the app's root font-size is
            // rebased to 14px (see global.scss), so those tokens land under 16px and trigger
            // iOS Safari's auto-zoom-on-focus for any font-size below that threshold.
            "h-10 rounded-md border border-line-strong bg-surface px-3 text-[16px] sm:text-sm text-ink",
            "focus:outline-none focus:border-ink focus:ring-2 focus:ring-info/35 transition-colors",
            "[&>option]:bg-surface [&>option]:text-ink",
            className
          )}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";

export default Select;
