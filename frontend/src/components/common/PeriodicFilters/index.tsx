"use client";

import { cn } from "@utils/cn";

const PERIODS = [
  { value: "7d",  label: "7d" },
  { value: "30d", label: "30d" },
  { value: "mtd", label: "MTD" },
  { value: "6m",  label: "6M" },
  { value: "ytd", label: "YTD" },
  { value: "2y",  label: "2Y" },
  { value: "all", label: "All" },
] as const;

export type PeriodValue = (typeof PERIODS)[number]["value"];

type Props = {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
  className?: string;
};

const PeriodicFilters = ({ value, onChange, className }: Props) => {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center p-0.5 rounded-md border border-line-strong bg-surface",
        className
      )}
    >
      {PERIODS.map((p) => {
        const active = value === p.value;
        return (
          <button
            key={p.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p.value)}
            className={cn(
              "px-3 h-7 rounded-sm text-xs font-mono font-medium tracking-wider uppercase transition-colors",
              active
                ? "bg-primary text-on-primary"
                : "text-muted hover:text-ink hover:bg-surface-2"
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
};

export default PeriodicFilters;
