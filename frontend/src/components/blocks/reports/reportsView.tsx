"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
  Cell,
} from "recharts";
import { getDay, parseISO } from "date-fns";
import PageLayout from "@components/common/PageLayout";
import Button from "@components/common/Button";
import LoadingOverlay from "@components/common/LoadingOverlay";
import CategoryDonut from "@components/blocks/charts/CategoryDonut";
import { useDashboardChart, useDashboardSummary } from "@hooks/useDashboard";
import { useTransactions } from "@hooks/useTransactions";
import { downloadFullFinanceCsv } from "@/lib/export-full-csv";
import { formatPKR, formatPKRCompact } from "@utils/currency";
import { categoryFor } from "@utils/categories";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ReportsView = () => {
  const summaryQuery = useDashboardSummary();
  const chartQuery = useDashboardChart();
  const txQuery = useTransactions();

  const months = chartQuery.data ?? [];
  const summary = summaryQuery.data;
  const txs = txQuery.data ?? [];

  const savingsTrend = months.map((m) => ({
    label: m.label,
    rate: m.income > 0 ? Math.round(((m.income - m.expense) / m.income) * 1000) / 10 : 0,
  }));

  const netWorthTrend = (() => {
    if (!summary) return [];
    let running = summary.totalBalance;
    const out: Array<{ label: string; value: number }> = [];
    for (let i = months.length - 1; i >= 0; i--) {
      const m = months[i];
      if (!m) continue;
      out.unshift({ label: m.label, value: running });
      running -= m.income - m.expense;
    }
    return out;
  })();

  const heatmap = useMemo(() => {
    const now = Date.now();
    const cutoff = now - 90 * 86_400_000;
    const sums = [0, 0, 0, 0, 0, 0, 0];
    for (const t of txs) {
      if (t.type !== "expense") continue;
      const ms = new Date(t.date).getTime();
      if (ms < cutoff) continue;
      const d = getDay(parseISO(t.date.slice(0, 10)));
      sums[d] += t.amount;
    }
    const max = Math.max(...sums, 1);
    return WEEKDAY_LABELS.map((label, i) => ({
      label,
      total: sums[i],
      intensity: sums[i] / max,
    }));
  }, [txs]);

  const weekendSplit = useMemo(() => {
    const now = Date.now();
    const cutoff = now - 90 * 86_400_000;
    let weekend = 0;
    let weekday = 0;
    for (const t of txs) {
      if (t.type !== "expense") continue;
      const ms = new Date(t.date).getTime();
      if (ms < cutoff) continue;
      const d = getDay(parseISO(t.date.slice(0, 10)));
      if (d === 0 || d === 6) weekend += t.amount;
      else weekday += t.amount;
    }
    return { weekend, weekday, total: weekend + weekday };
  }, [txs]);

  const barData = (summary?.expenseByCategory ?? []).map((c) => ({
    name: c.category,
    total: c.total,
    color: categoryFor(c.category).color,
  }));

  return (
    <PageLayout
      eyebrow="The retrospective"
      title={
        <>
          Six months in <em className="italic text-gold">review</em>.
        </>
      }
      subtitle="Trends, heatmaps, weekend spend, and exports — all from your local ledger."
      actions={
        <Button variant="outline" onClick={() => downloadFullFinanceCsv()}>
          Export full CSV
        </Button>
      }
    >
      {summaryQuery.isLoading || chartQuery.isLoading || txQuery.isLoading ? (
        <LoadingOverlay rows={5} />
      ) : (
        <div className="space-y-6">
          <article className="rounded-2xl border border-line-strong bg-surface p-6">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <span className="editorial-rule">Trend</span>
                <h3 className="font-display text-2xl mt-2">Income &amp; expense, monthly</h3>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={months} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="rgb(var(--c-line))" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      fill: "rgb(var(--c-muted))",
                    }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatPKRCompact(v as number)}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      fill: "rgb(var(--c-muted))",
                    }}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgb(var(--c-surface))",
                      border: "1px solid rgb(var(--c-line))",
                      borderRadius: 10,
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatPKR(v)}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="rgb(var(--c-emerald))"
                    strokeWidth={1.8}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="rgb(var(--c-gold))"
                    strokeWidth={1.8}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <article className="rounded-2xl border border-line-strong bg-surface p-6">
              <span className="editorial-rule">Composition</span>
              <h3 className="font-display text-2xl mt-2 mb-4">Spend by category · MTD</h3>
              {summary && summary.expenseByCategory.length > 0 ? (
                <CategoryDonut data={summary.expenseByCategory} />
              ) : (
                <p className="text-sm text-muted">No expense data yet.</p>
              )}
            </article>

            <article className="rounded-2xl border border-line-strong bg-surface p-6">
              <span className="editorial-rule">Bars</span>
              <h3 className="font-display text-2xl mt-2 mb-4">MTD spending by category</h3>
              {barData.length === 0 ? (
                <p className="text-sm text-muted">No data.</p>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid stroke="rgb(var(--c-line))" horizontal={false} opacity={0.5} />
                      <XAxis type="number" tickFormatter={(v) => formatPKRCompact(v as number)} />
                      <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => formatPKR(v)} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {barData.map((e) => (
                          <Cell key={e.name} fill={e.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <article className="rounded-2xl border border-line-strong bg-surface p-6">
              <span className="editorial-rule">Heatmap</span>
              <h3 className="font-display text-2xl mt-2 mb-4">Expense by weekday · last 90 days</h3>
              <div className="grid grid-cols-7 gap-2">
                {heatmap.map((h) => (
                  <div key={h.label} className="text-center">
                    <div
                      className="h-16 rounded-lg border border-line-strong flex flex-col items-center justify-center gap-1"
                      style={{
                        background: `rgb(var(--c-primary) / ${0.12 + h.intensity * 0.55})`,
                      }}
                    >
                      <span className="font-mono text-[10px] text-muted">{h.label}</span>
                      <span className="font-display text-xs tabular">{formatPKRCompact(h.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-line-strong bg-surface p-6">
              <span className="editorial-rule">Weekend</span>
              <h3 className="font-display text-2xl mt-2 mb-4">Weekend vs weekday · last 90 days</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-muted text-sm">Weekend (SatSun)</span>
                  <span className="font-display text-xl tabular">{formatPKR(weekendSplit.weekend)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-muted text-sm">Weekday (MonFri)</span>
                  <span className="font-display text-xl tabular">{formatPKR(weekendSplit.weekday)}</span>
                </div>
                {weekendSplit.total > 0 && (
                  <p className="text-xs text-muted font-mono">
                    Weekend share ·{" "}
                    {Math.round((weekendSplit.weekend / weekendSplit.total) * 100)}% of tracked spend
                  </p>
                )}
              </div>
            </article>
          </div>

          <article className="rounded-2xl border border-line-strong bg-surface p-6">
            <span className="editorial-rule">Trend</span>
            <h3 className="font-display text-2xl mt-2 mb-4">Savings rate</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savingsTrend} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                  <CartesianGrid stroke="rgb(var(--c-line))" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      fill: "rgb(var(--c-muted))",
                    }}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      fill: "rgb(var(--c-muted))",
                    }}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgb(var(--c-surface))",
                      border: "1px solid rgb(var(--c-line))",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => `${v}%`}
                  />
                  <Line type="monotone" dataKey="rate" stroke="rgb(var(--c-gold))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-2xl border border-line-strong bg-surface p-6">
            <span className="editorial-rule">Long view</span>
            <h3 className="font-display text-2xl mt-2 mb-4">Net worth tracker</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={netWorthTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="rgb(var(--c-line))" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      fill: "rgb(var(--c-muted))",
                    }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatPKRCompact(v as number)}
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      fill: "rgb(var(--c-muted))",
                    }}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgb(var(--c-surface))",
                      border: "1px solid rgb(var(--c-line))",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatPKR(v)}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="rgb(var(--c-emerald))"
                    strokeWidth={2.2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      )}
    </PageLayout>
  );
};

export default ReportsView;
