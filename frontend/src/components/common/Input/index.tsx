"use client";

import * as React from "react";
import { cn } from "@utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leading, trailing, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "relative flex items-center rounded-md border bg-surface transition-colors",
            error
              ? "border-terra focus-within:border-terra"
              : "border-line-strong focus-within:border-ink focus-within:ring-2 focus-within:ring-info/35"
          )}
        >
          {leading && <span className="pl-3 text-muted">{leading}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              // 16px, not text-base — the app's root font-size is rebased to 14px (global.scss),
              // so text-base lands at 14px and still triggers iOS Safari's zoom-on-focus.
              "flex-1 bg-transparent px-3 py-2.5 text-[16px] sm:text-sm text-ink placeholder:text-muted/60",
              "focus:outline-none disabled:opacity-50",
              leading && "pl-2",
              trailing && "pr-2",
              className
            )}
            {...props}
          />
          {trailing && <span className="pr-3 text-muted">{trailing}</span>}
        </div>
        {error ? (
          <p className="font-mono text-[10px] tracking-wide text-terra">{error}</p>
        ) : hint ? (
          <p className="font-mono text-[10px] tracking-wide text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
