"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ShoppingCart, Download, CalendarDays } from "lucide-react";
import PageLayout from "@components/common/PageLayout";
import Button from "@components/common/Button";
import Search from "@components/common/Search";
import Modal from "@components/common/Modal";
import Select from "@components/common/Select";
import Input from "@components/common/Input";
import FallBackState from "@components/common/FallBackState";
import LoadingOverlay from "@components/common/LoadingOverlay";
import TransactionForm from "@components/blocks/forms/transactionForm";
import { useTransactions, useDeleteTransaction } from "@hooks/useTransactions";
import { useAccounts } from "@hooks/useAccounts";
import { categoryFor, EXPENSE_CATEGORIES } from "@utils/categories";
import { formatPKR } from "@utils/currency";
import { formatDate } from "@utils/date";
import type { Transaction } from "@utils/types";
import { toast } from "sonner";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ── Compact expense card ──────────────────────────────────────────────────────
const ExpenseCard = ({
  tx,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const def = categoryFor(tx.category);
  const Icon = def.icon;
  const dateStr = new Date(tx.date + (tx.date.length === 10 ? "T12:00:00" : "")).toLocaleDateString(
    "en-PK",
    { day: "numeric", month: "short", year: "numeric" }
  );
  return (
    <div
      className="group relative rounded-2xl border border-line-strong bg-surface overflow-hidden
                    hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-default"
    >
      {/* Top color strip */}
      <div className="h-1 w-full" style={{ background: def.color }} />

      <div className="p-3">
        {/* Icon + category + actions */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-7 w-7 rounded-lg grid place-items-center shrink-0"
              style={{ background: `${def.color}20`, color: def.color }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold text-ink truncate">{tx.category}</span>
          </div>
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="p-1 rounded-md text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1 rounded-md text-muted hover:text-terra hover:bg-terra/10 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <span className="group-hover:hidden font-mono text-[9px] text-faint shrink-0">
            {dateStr}
          </span>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted leading-snug line-clamp-1 mb-2.5 min-h-[16px]">
          {tx.description || "—"}
        </p>

        {/* Amount + wallet */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-line-strong text-muted bg-surface-2 truncate max-w-[80px]">
            {tx.wallet?.name ?? "—"}
          </span>
          <span className="font-mono text-sm font-bold text-terra">
            −{formatPKR(tx.amount, { showSymbol: false })}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Stat tile ─────────────────────────────────────────────────────────────────
const Tile = ({
  label,
  value,
  sub,
  tone = "muted",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "expense" | "warning" | "muted";
}) => {
  const variant =
    tone === "expense"
      ? "ff-tile ff-tile--expense"
      : tone === "warning"
        ? "ff-tile ff-tile--warning"
        : "ff-tile ff-tile--muted";
  const isText = typeof value !== "number";
  return (
    <div className={`${variant}${isText ? " ff-tile--text" : ""}`}>
      <div className="ff-tile__head">
        <span className="ff-tile__label">{label}</span>
      </div>
      <p className="ff-tile__value">
        {isText ? (
          value
        ) : (
          <>
            <span className="currency">₨</span>
            {formatPKR(value as number, { showSymbol: false })}
          </>
        )}
      </p>
      {sub && <span className="ff-tile__sub">{sub}</span>}
    </div>
  );
};

// ── Main view ─────────────────────────────────────────────────────────────────
const ExpensesView = () => {
  const [q, setQ] = useState("");
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [walletId, setWalletId] = useState("");
  const [category, setCategory] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const { data: wallets = [] } = useAccounts();
  const { data, isLoading } = useTransactions();
  const del = useDeleteTransaction();

  const allExpenses = useMemo(() => (data ?? []).filter((t) => t.type === "expense"), [data]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const t of allExpenses) set.add(new Date(t.date).getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [allExpenses]);

  const filtered = useMemo(() => {
    let rows = [...allExpenses];
    if (selectedYear !== "all") {
      const yr = Number(selectedYear);
      rows = rows.filter((t) => new Date(t.date).getFullYear() === yr);
    }
    if (selectedYear !== "all" && selectedMonth !== "all") {
      const mo = Number(selectedMonth);
      rows = rows.filter((t) => new Date(t.date).getMonth() + 1 === mo);
    }
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rows = rows.filter((t) =>
        `${t.description ?? ""} ${t.category} ${(t.tags ?? []).join(" ")}`.toLowerCase().includes(s)
      );
    }
    if (walletId) rows = rows.filter((t) => t.wallet?.id === walletId);
    if (category) rows = rows.filter((t) => t.category === category);
    const minN = minAmount === "" ? undefined : Number(minAmount);
    const maxN = maxAmount === "" ? undefined : Number(maxAmount);
    if (minN !== undefined && !isNaN(minN)) rows = rows.filter((t) => t.amount >= minN);
    if (maxN !== undefined && !isNaN(maxN)) rows = rows.filter((t) => t.amount <= maxN);
    return rows;
  }, [allExpenses, q, selectedYear, selectedMonth, walletId, category, minAmount, maxAmount]);

  const totalSpent = filtered.reduce((s, t) => s + Number(t.amount), 0);
  const avgPerDay = (() => {
    if (!filtered.length) return 0;
    const days = new Set(filtered.map((t) => t.date.slice(0, 10))).size;
    return days ? totalSpent / days : 0;
  })();
  const topCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filtered) map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount));
    let best = "",
      bestAmt = 0;
    map.forEach((amt, cat) => {
      if (amt > bestAmt) {
        bestAmt = amt;
        best = cat;
      }
    });
    return { name: best, amount: bestAmt };
  }, [filtered]);

  const monthlyBreakdown = useMemo(() => {
    if (selectedYear === "all" || selectedMonth !== "all") return null;
    const yr = Number(selectedYear);
    return Array.from({ length: 12 }, (_, i) => {
      const mo = i + 1;
      const rows = allExpenses.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === yr && d.getMonth() + 1 === mo;
      });
      return rows.length
        ? {
            month: mo,
            label: MONTHS[i].slice(0, 3),
            total: rows.reduce((s, r) => s + Number(r.amount), 0),
            count: rows.length,
          }
        : null;
    }).filter(Boolean) as { month: number; label: string; total: number; count: number }[];
  }, [allExpenses, selectedYear, selectedMonth]);

  const exportCsv = () => {
    const header = ["date", "category", "description", "amount", "wallet"];
    const lines = filtered.map((t) =>
      [
        formatDate(t.date),
        t.category,
        JSON.stringify(t.description ?? ""),
        Number(t.amount).toFixed(2),
        JSON.stringify(t.wallet?.name ?? ""),
      ].join(",")
    );
    const blob = new Blob([header.join(",") + "\n" + lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success("Expense deleted");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const periodLabel =
    selectedYear === "all"
      ? "All time"
      : selectedMonth === "all"
        ? String(selectedYear)
        : `${MONTHS[Number(selectedMonth) - 1]} ${selectedYear}`;

  return (
    <PageLayout
      eyebrow="Outflows"
      title={
        <>
          Track every <em className="italic text-terra">expense</em>.
        </>
      }
      subtitle="Add, edit, and delete expenses — grouped by day."
      actions={
        <>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add expense
          </Button>
        </>
      }
    >
      {/* ── Toolbar ── */}
      <div className="ff-toolbar">
        <div className="ff-toolbar__row ff-toolbar__row--search">
          <Search value={q} onChange={setQ} placeholder="Search description, category…" />
          <div className="ff-toolbar__chip-row">
            <CalendarDays className="h-4 w-4 text-muted shrink-0" />
            <span className="font-mono text-[11px] tracking-wide text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
              {periodLabel}
            </span>
            {(selectedYear !== "all" || selectedMonth !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedYear("all");
                  setSelectedMonth("all");
                }}
                className="text-xs text-muted hover:text-ink underline cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="ff-toolbar__filters">
          <Select
            label="Year"
            options={[
              { value: "all", label: "All years" },
              ...availableYears.map((y) => ({ value: String(y), label: String(y) })),
            ]}
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedMonth("all");
            }}
          />
          <Select
            label="Month"
            options={[
              { value: "all", label: selectedYear === "all" ? "Select year first" : "All months" },
              ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
            ]}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={selectedYear === "all"}
          />
          <Select
            label="Wallet"
            options={[
              { value: "", label: "All wallets" },
              ...wallets.map((w) => ({ value: w.id, label: w.name })),
            ]}
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
          />
          <Select
            label="Category"
            options={[
              { value: "", label: "All categories" },
              ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="Min ₨"
            type="number"
            placeholder="0"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
          />
          <Input
            label="Max ₨"
            type="number"
            placeholder="Any"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
          />
        </div>
      </div>

      {/* ── Stat tiles ── */}
      <div className="ff-tile-grid ff-tile-grid--3">
        <Tile label={`Total · ${periodLabel}`} value={totalSpent} tone="expense" />
        <Tile label="Avg per day" value={avgPerDay} tone="warning" />
        <Tile
          label="Top category"
          value={topCat.name || "—"}
          sub={
            topCat.amount > 0 ? `₨ ${formatPKR(topCat.amount, { showSymbol: false })}` : undefined
          }
        />
      </div>

      {/* ── Monthly breakdown ── */}
      {monthlyBreakdown && monthlyBreakdown.length > 0 && (
        <div>
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-muted mb-3">
            {selectedYear} · month by month
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {monthlyBreakdown.map(({ month, label, total, count }) => (
              <button
                key={month}
                type="button"
                onClick={() => setSelectedMonth(String(month))}
                className="group text-left rounded-xl border border-line-strong bg-surface p-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-150"
              >
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted group-hover:text-primary transition-colors">
                  {label}
                </p>
                <p className="font-display text-base mt-1 text-terra leading-none">
                  <span className="text-muted text-xs mr-0.5">₨</span>
                  {formatPKR(total, { showSymbol: false })}
                </p>
                <p className="text-[10px] text-faint mt-1">{count} items</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Expense cards ── */}
      {isLoading ? (
        <LoadingOverlay rows={6} />
      ) : filtered.length === 0 ? (
        <FallBackState
          icon={ShoppingCart}
          title="No expenses found"
          description="Try widening your filters or add a new expense."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 ff-stagger">
          {filtered
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((tx) => (
              <ExpenseCard
                key={tx.id}
                tx={tx}
                onEdit={() => setEditing(tx)}
                onDelete={() => setDeleting(tx)}
              />
            ))}
        </div>
      )}

      {/* ── Modals ── */}
      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add expense"
        description="Log a new expense. Wallet balance will update automatically."
      >
        <TransactionForm defaultType="expense" lockType onDone={() => setAddOpen(false)} />
      </Modal>

      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Edit expense"
        description="Update the expense details below."
      >
        {editing && (
          <TransactionForm
            defaultType="expense"
            lockType
            editing={editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete expense?"
        description="This cannot be undone."
      >
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Remove <strong className="text-ink">{deleting.category}</strong>
              {deleting.description ? ` — ${deleting.description}` : ""} of{" "}
              <strong className="text-terra">{formatPKR(deleting.amount)}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleting(null)} disabled={del.isPending}>
                Cancel
              </Button>
              <Button variant="danger" loading={del.isPending} onClick={() => void confirmDelete()}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default ExpensesView;
