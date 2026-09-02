"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryFor } from "@utils/categories";
import { formatPKR } from "@utils/currency";

type Props = {
  data: Array<{ category: string; total: number }>;
};

type DonutTooltipProps = {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
};

const DonutTooltip = ({ active, payload }: DonutTooltipProps) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  if (!entry) return null;
  return (
    <div className="rounded-lg border border-line-strong bg-surface shadow-elevated p-2.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-sm" style={{ background: entry.payload.color }} />
        <span className="text-ink capitalize">{entry.name}</span>
        <span className="font-display text-sm tabular">{formatPKR(entry.value)}</span>
      </div>
    </div>
  );
};

const CategoryDonut = ({ data }: Props) => {
  const total = data.reduce((s, d) => s + d.total, 0);
  const enriched = data.map((d) => ({ ...d, color: categoryFor(d.category).color }));

  return (
    <div className="relative h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={enriched}
            dataKey="total"
            nameKey="category"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {enriched.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
            Spent · MTD
          </p>
          <p className="font-display text-2xl mt-1 tabular">{formatPKR(total)}</p>
        </div>
      </div>
    </div>
  );
};

export default CategoryDonut;
