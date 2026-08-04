"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Wallet,
  Plus,
  Calendar,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import CountUp from "@components/common/CountUp";
import Button from "@components/common/Button";
import LoadingOverlay, { Skeleton } from "@components/common/LoadingOverlay";
import FallBackState from "@components/common/FallBackState";
import Greetings from "@components/common/Greetings";
import IncomeExpenseChart from "@components/blocks/charts/IncomeExpenseChart";
import CategoryDonut from "@components/blocks/charts/CategoryDonut";
import QuickAddModal, { type QuickAddKind } from "@components/blocks/forms/quickAddModal";
import WidgetDatePicker, { type DateRange } from "@components/common/WidgetDatePicker";
import { useDashboardSummary, useDashboardChart } from "@hooks/useDashboard";
import { shouldUseCloudFinance } from "@/lib/finance-backend-mode";
import { formatPKR, formatPKRCompact } from "@utils/currency";
import { relativeDate, monthName } from "@utils/date";
import { categoryFor } from "@utils/categories";

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "income" | "expense" | "savings" | "neutral";
  footer?: React.ReactNode;
};

const StatCard = ({ label, value, icon, tone, footer }: StatCardProps) => {
  const colors = {
    income:  { bg: "bg-emerald/10",  text: "text-emerald",  border: "border-emerald/15" },
    expense: { bg: "bg-terra/10",    text: "text-terra",    border: "border-terra/15" },
    savings: { bg: "bg-primary/10",  text: "text-primary",  border: "border-primary/15" },
    neutral: { bg: "bg-surface-2",   text: "text-muted",    border: "border-line-strong" },
  }[tone];

  return (
    <div className={`ff-dashboard__stat ${colors.border}`} style={{ borderColor: undefined }}>
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">{label}</span>
        <span className={`stat-icon ${colors.bg} ${colors.text}`}>
          {icon}
        </span>
      </div>
      <div className="stat-value">
        <span className="currency">₨</span>
        <CountUp to={Math.abs(value)} format={(v) => formatPKR(v, { showSymbol: false })} />
      </div>
      {footer && <div className="stat-trend mt-2">{footer}</div>}
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="ff-dashboard space-y-6">
    <Skeleton className="h-10 w-[45%]" />
    <Skeleton className="h-[200px] w-full rounded-2xl" />
    <div className="ff-tile-grid ff-tile-grid--3">
      <Skeleton className="h-[120px] rounded-xl" />
      <Skeleton className="h-[120px] rounded-xl" />
      <Skeleton className="h-[120px] rounded-xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Skeleton className="h-[300px] rounded-xl" />
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
    <LoadingOverlay rows={5} />
  </div>
);

const DashboardView = () => {
  const cloudBacked = shouldUseCloudFinance();

  const [summaryRange, setSummaryRange] = useState<DateRange | undefined>();
  const [chartRange, setChartRange] = useState<DateRange | undefined>();
  const summaryQuery = useDashboardSummary(summaryRange);
  const chartQuery = useDashboardChart(chartRange);
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; kind: QuickAddKind }>({
    open: false,
    kind: "expense",
  });
  const openQuickAdd = (kind: QuickAddKind): void => setQuickAdd({ open: true, kind });

  const summary = summaryQuery.data;
  const chart = chartQuery.data ?? [];

  const now = new Date();
  const monthLabel = `${monthName(now.getMonth() + 1)} · ${now.getFullYear()}`;

  const topCategories = useMemo(
    () => (summary?.expenseByCategory ?? []).slice(0, 6),
    [summary?.expenseByCategory]
  );

  if (summaryQuery.isLoading && !summary) return <DashboardSkeleton />;

  if (summaryQuery.error || !summary) {
    return (
      <div className="ff-dashboard">
        <FallBackState
          variant="error"
          title="Couldn't load your dashboard"
          description="Add a wallet or log a transaction to see your dashboard."
          action={
            <Button variant="outline" onClick={() => summaryQuery.refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="ff-dashboard ff-stagger pb-12">
      {/* ── Masthead ────────────────────────────────────── */}
      <header className="ff-dashboard__masthead">
        <div className="space-y-3">
          <span className="editorial-rule">Issue · {monthLabel}</span>
          <Greetings />
        </div>
        <div className="meta">
          <span>
            <span className="dot" />
            {cloudBacked ? "Signed in · synced to database" : "Local · browser storage"}
          </span>
          <span>{summary.wallets.length} wallets</span>
          <span>{summary.savingsRate}% saved this month</span>
        </div>
      </header>

      {/* ── Hero: total balance + stat cards ────────────── */}
      <section className="ff-dashboard__hero">
        <div className="total">
          <span className="label">Total balance · all wallets</span>
          <div className="figure">
            <span className="currency">₨</span>
            <span className="amount">
              <CountUp
                to={summary.totalBalance}
                format={(v) => formatPKR(v, { showSymbol: false })}
              />
            </span>
          </div>
          <div className="accounts-strip">
            {summary.wallets.map((a) => (
              <span key={a.id} className="pill">
                <span className="swatch" style={{ background: a.color }} />
                {a.name} · {formatPKRCompact(a.balance)}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 self-stretch">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-faint">
              {summaryRange ? "Filtered period" : "This month"}
            </span>
            <WidgetDatePicker value={summaryRange} onChange={setSummaryRange} />
          </div>
          <StatCard
            label={summaryRange ? "Income · period" : "Income this month"}
            icon={<ArrowDownRight className="h-3.5 w-3.5" />}
            value={summary.monthlyIncome}
            tone="income"
            footer={
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 up" />
                <span className="up">Earnings logged</span>
              </span>
            }
          />
          <StatCard
            label={summaryRange ? "Expense · period" : "Expense this month"}
            icon={<ArrowUpRight className="h-3.5 w-3.5" />}
            value={summary.monthlyExpense}
            tone="expense"
            footer={
              <span className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 down" />
                <span className="down">Total spent</span>
              </span>
            }
          />
          <StatCard
            label={summaryRange ? "Net saved · period" : "Net saved this month"}
            icon={<Sparkles className="h-3.5 w-3.5" />}
            value={summary.monthlySavings}
            tone={summary.monthlySavings >= 0 ? "savings" : "expense"}
            footer={
              <span>
                Savings rate ·{" "}
                <span className="text-primary font-semibold">{summary.savingsRate}%</span>
              </span>
            }
          />
        </div>
      </section>

      {/* ── Charts: income/expense + category donut ──────── */}
      <section className="ff-dashboard__split">
        <article className="ff-dashboard__panel">
          <div className="panel-head">
            <div>
              <span className="editorial-rule">{chartRange ? "Custom range" : "Six-month ledger"}</span>
              <h3 className="mt-2">Income vs Expense</h3>
            </div>
            <WidgetDatePicker value={chartRange} onChange={setChartRange} />
          </div>
          {chartQuery.isLoading ? (
            <Skeleton className="h-[280px] w-full rounded-lg" />
          ) : (
            <IncomeExpenseChart data={chart} />
          )}
        </article>

        <article className="ff-dashboard__panel">
          <div className="panel-head">
            <div>
              <span className="editorial-rule">{summaryRange ? "Filtered period" : "This month"}</span>
              <h3 className="mt-2">Where it went</h3>
            </div>
            <WidgetDatePicker value={summaryRange} onChange={setSummaryRange} />
          </div>
          {summary.expenseByCategory.length === 0 ? (
            <FallBackState
              icon={Wallet}
              title="No spend yet"
              description="Add a transaction to see where your money is flowing."
            />
          ) : (
            <>
              <CategoryDonut data={summary.expenseByCategory} />
              <ul className="mt-4 space-y-1.5">
                {topCategories.map((c) => {
                  const def = categoryFor(c.category);
                  const CatIcon = def.icon;
                  const pct =
                    summary.monthlyExpense > 0
                      ? Math.round((c.total / summary.monthlyExpense) * 100)
                      : 0;
                  return (
                    <li key={c.category} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-ink">
                        <span
                          className="h-6 w-6 rounded-lg grid place-items-center flex-shrink-0"
                          style={{ background: `${def.color}22`, color: def.color }}
                        >
                          <CatIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-medium">{c.category}</span>
                      </span>
                      <span className="font-mono tabular text-muted">
                        {formatPKRCompact(c.total)}
                        <span className="text-faint ml-1">· {pct}%</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </article>
      </section>

      {/* ── Wallet distribution donut ─────────────────────── */}
      {summary.walletDistribution.length > 0 && (
        <section className="ff-dashboard__panel">
          <div className="panel-head">
            <div>
              <span className="editorial-rule">Allocation</span>
              <h3 className="mt-2">Balance by wallet</h3>
            </div>
          </div>
          <div className="h-[200px] w-full max-w-xs mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.walletDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={3}
                  isAnimationActive
                >
                  {summary.walletDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatPKR(v)}
                  contentStyle={{
                    background: "rgb(var(--c-surface-2))",
                    border: "1px solid rgb(var(--c-line))",
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: "var(--shadow-raised)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── Transactions + Budget ─────────────────────────── */}
      <section className="ff-dashboard__split">
        <article className="ff-dashboard__panel">
          <div className="panel-head">
            <div>
              <span className="editorial-rule">{summaryRange ? "Filtered period" : "Latest entries"}</span>
              <h3 className="mt-2">Recent transactions</h3>
            </div>
            <div className="flex items-center gap-2">
              <WidgetDatePicker value={summaryRange} onChange={setSummaryRange} />
              <Link
                href="/transactions"
                className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary hover:underline"
              >
                View all →
              </Link>
            </div>
          </div>

          {summary.recentTransactions.length === 0 ? (
            <FallBackState
              icon={Wallet}
              title="Nothing here yet"
              description="Your most recent transactions will appear here."
              action={
                <Button variant="outline" onClick={() => openQuickAdd("expense")}>
                  <Plus className="h-3.5 w-3.5" />
                  Add transaction
                </Button>
              }
            />
          ) : (
            <ul>
              {summary.recentTransactions.map((tx) => {
                const def = categoryFor(tx.category);
                const CatIcon = def.icon;
                const income =
                  tx.type === "income" ||
                  (tx.type === "transfer" && tx.transferDirection === "in");
                return (
                  <li key={tx.id} className="ff-dashboard__tx-row">
                    <span
                      className="swatch"
                      style={{ background: `${def.color}20`, color: def.color }}
                    >
                      <CatIcon className="h-4 w-4" />
                    </span>
                    <div className="body">
                      <span className="desc">{tx.description ?? tx.category}</span>
                      <span className="meta">
                        <span>{tx.category}</span>
                        <span>·</span>
                        <em>{tx.wallet?.name ?? "—"}</em>
                        <span>·</span>
                        <span>{relativeDate(tx.date)}</span>
                      </span>
                    </div>
                    <span className={`amount ${income ? "income" : "expense"} tabular`}>
                      {income ? "+" : "−"}
                      {formatPKR(tx.amount, { showSymbol: false })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="ff-dashboard__panel">
          <div className="panel-head">
            <div>
              <span className="editorial-rule">Budget</span>
              <h3 className="mt-2">This month</h3>
            </div>
            <Link
              href="/budget"
              className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary hover:underline"
            >
              Manage →
            </Link>
          </div>

          {summary.budgetOverview.length === 0 ? (
            <FallBackState
              icon={Wallet}
              title="No budgets"
              description="Set monthly limits per category to track spending."
              action={
                <Button variant="outline" asChild>
                  <Link href="/budget">Open budget planner</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-4">
              {summary.budgetOverview.slice(0, 5).map((b) => {
                const fillColor =
                  b.state === "over"
                    ? "rgb(var(--c-terra))"
                    : b.state === "warn"
                      ? "rgb(var(--c-warning))"
                      : "rgb(var(--c-emerald))";
                return (
                  <li key={b.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-ink font-medium">{b.category}</span>
                      <span className="font-mono text-faint tabular">
                        {formatPKRCompact(b.spent)}{" "}
                        <span className="text-faint">/</span>{" "}
                        {formatPKRCompact(b.limit)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <span
                        className="block h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(b.pct, 100)}%`,
                          background: fillColor,
                          boxShadow: b.state === "over"
                            ? "0 0 8px rgb(var(--c-terra) / 0.5)"
                            : undefined,
                        }}
                      />
                    </div>
                    {b.state === "warn" && (
                      <p className="font-mono text-[9px] text-warning mt-1 uppercase tracking-wider">
                        → Over 80% used
                      </p>
                    )}
                    {b.state === "over" && (
                      <p className="font-mono text-[9px] text-terra mt-1 uppercase tracking-wider">
                        ✕ Over budget
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Upcoming subscriptions */}
          <div className="panel-head mt-8">
            <div>
              <span className="editorial-rule">Subscriptions</span>
              <h3 className="mt-2">Due within 7 days</h3>
            </div>
            <Link
              href="/subscriptions"
              className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary hover:underline"
            >
              All →
            </Link>
          </div>

          {summary.upcomingSubscriptions.length === 0 ? (
            <p className="text-xs text-faint">Nothing renewing this week.</p>
          ) : (
            <ul className="space-y-3 mt-2">
              {summary.upcomingSubscriptions.map((s) => {
                const urgencyColor =
                  s.daysUntil <= 2
                    ? "text-terra"
                    : s.daysUntil <= 5
                      ? "text-warning"
                      : "text-emerald";
                return (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-faint flex-shrink-0" />
                      <span>
                        <span className="font-medium text-ink">{s.name}</span>
                        <span className="block font-mono text-[9px] text-faint uppercase tracking-wider mt-0.5">
                          {s.walletName} ·{" "}
                          <span className={urgencyColor}>
                            {s.daysUntil === 0 ? "today" : `in ${s.daysUntil}d`}
                          </span>
                        </span>
                      </span>
                    </span>
                    <span className="font-mono tabular text-sm font-semibold text-ink">
                      {formatPKRCompact(s.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>

      <QuickAddModal
        open={quickAdd.open}
        onOpenChange={(open) => setQuickAdd((prev) => ({ ...prev, open }))}
        initial={quickAdd.kind}
      />
    </div>
  );
};

export default DashboardView;
