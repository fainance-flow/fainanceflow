"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays, X } from "lucide-react";

export type DateRange = { from: string; to: string };

type Props = {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
};

const fmt = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m)-1]} ${y}`;
};

const WidgetDatePicker = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(value?.from ?? "");
  const [to,   setTo]   = useState(value?.to   ?? "");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync if parent resets
  useEffect(() => {
    if (!value) { setFrom(""); setTo(""); }
  }, [value]);

  const apply = () => {
    if (from && to && from <= to) {
      onChange({ from, to });
      setOpen(false);
    }
  };

  const clear = () => {
    setFrom(""); setTo("");
    onChange(undefined);
    setOpen(false);
  };

  const active = !!value?.from && !!value?.to;

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={[
          "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-mono transition-colors cursor-pointer",
          active
            ? "bg-primary/10 text-primary border border-primary/25"
            : "bg-surface-2 text-muted border border-line-strong hover:text-ink hover:border-primary/30",
        ].join(" ")}
      >
        <CalendarDays className="h-3 w-3" />
        {active ? `${fmt(value!.from)} – ${fmt(value!.to)}` : "Filter date"}
        {active && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="ml-0.5 hover:text-terra cursor-pointer"
          >
            <X className="h-2.5 w-2.5" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-surface border border-line-strong rounded-xl shadow-xl p-3 w-64">
          <p className="font-mono text-[9px] tracking-[0.16em] uppercase text-muted mb-2">Date range</p>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-faint block mb-0.5">From</label>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={e => setFrom(e.target.value)}
                className="w-full text-xs rounded-lg border border-line-strong bg-surface-2 px-2 py-1.5 text-ink focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-faint block mb-0.5">To</label>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={e => setTo(e.target.value)}
                className="w-full text-xs rounded-lg border border-line-strong bg-surface-2 px-2 py-1.5 text-ink focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={apply}
              disabled={!from || !to || from > to}
              className="flex-1 text-xs font-semibold rounded-md py-1.5 bg-primary text-on-primary disabled:opacity-50 hover:bg-primary-active transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Apply
            </button>
            {active && (
              <button
                type="button"
                onClick={clear}
                className="px-3 text-xs rounded-lg border border-line-strong text-muted hover:text-terra hover:border-terra/30 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetDatePicker;
