"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { formatPKR, formatPKRCompact } from "@utils/currency";
import type { ChartPoint } from "@utils/types";

type Props = {
  data: ChartPoint[];
};

type TooltipPayloadEntry = {
  dataKey: string;
  value: number;
  color: string;
};

type TooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line-strong bg-surface shadow-elevated p-3 min-w-[160px]">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
              <span className="capitalize text-ink">{p.dataKey}</span>
            </span>
            <span className="font-display text-sm tabular">{formatPKR(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const IncomeExpenseChart = ({ data }: Props) => {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap="22%"
          margin={{ top: 12, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            stroke="rgb(var(--c-line))"
            strokeDasharray="0"
            vertical={false}
            opacity={0.5}
          />
          <XAxis
            dataKey="label"
            tick={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              fill: "rgb(var(--c-muted))",
              letterSpacing: "0.14em",
            }}
            tickLine={false}
            axisLine={false}
            dy={6}
          />
          <YAxis
            tickFormatter={(v) => formatPKRCompact(v as number)}
            tick={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              fill: "rgb(var(--c-muted))",
            }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip cursor={{ fill: "rgb(var(--c-line) / 0.3)" }} content={<CustomTooltip />} />
          <Bar dataKey="income" radius={[6, 6, 0, 0]} maxBarSize={18}>
            {data.map((_, i) => (
              <Cell key={`income-${i}`} fill="rgb(var(--c-emerald))" />
            ))}
          </Bar>
          <Bar dataKey="expense" radius={[6, 6, 0, 0]} maxBarSize={18}>
            {data.map((_, i) => (
              <Cell key={`expense-${i}`} fill="rgb(var(--c-gold))" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseChart;
