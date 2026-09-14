"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Wallet, Pencil, Trash2, Upload } from "lucide-react";
import PageLayout from "@components/common/PageLayout";
import Button from "@components/common/Button";
import Search from "@components/common/Search";
import Table from "@components/common/Table";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import FallBackState from "@components/common/FallBackState";
import LoadingOverlay from "@components/common/LoadingOverlay";
import Badge from "@components/common/Badge";
import PeriodicFilters, { type PeriodValue } from "@components/common/PeriodicFilters";
import TransactionForm from "@components/blocks/forms/transactionForm";
import CsvImportModal from "@components/blocks/forms/csvImportModal";
import { useTransactions, useDeleteTransaction } from "@hooks/useTransactions";
import { useAccounts } from "@hooks/useAccounts";
import { categoryFor, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@utils/categories";
import { formatPKR } from "@utils/currency";
import { formatDate } from "@utils/date";
import type { Transaction } from "@utils/types";
import { toast } from "sonner";

type TileProps = {
  label: string;
  value: number;
  tone: "income" | "expense" | "accent";
};

const Tile = ({ label, value, tone }: TileProps) => (
  <div className={`ff-tile ff-tile--${tone}`}>
    <div className="ff-tile__head">
      <span className="ff-tile__label">{label}</span>
    </div>
    <p className="ff-tile__value">
      <span className="currency">₨</span>
      {formatPKR(Math.abs(value), { showSymbol: false })}
    </p>
  </div>
);

const allCategories = Array.from(
  new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, "Transfer"])
);

const TransactionsView = () => {
  const [q, setQ] = useState<string>("");
  const [period, setPeriod] = useState<PeriodValue>("30d");
  const [open, setOpen] = useState<boolean>(false);
  const [importOpen, setImportOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [walletId, setWalletId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  const { data: wallets = [] } = useAccounts();
  const { data, isLoading } = useTransactions();
  const del = useDeleteTransaction();
  const all = data ?? [];

  const filtered = useMemo(() => {
    const now = Date.now();
    const d = new Date();
    const cutoffMs: Record<PeriodValue, number> = {
      "7d": now - 7 * 86_400_000,
      "30d": now - 30 * 86_400_000,
      mtd: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
      "6m": new Date(d.getFullYear(), d.getMonth() - 6, 1).getTime(),
      ytd: new Date(d.getFullYear(), 0, 1).getTime(),
      "2y": new Date(d.getFullYear() - 2, d.getMonth(), 1).getTime(),
      all: 0,
    };
    let rows = all.filter((t) => new Date(t.date).getTime() >= cutoffMs[period]);
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
    if (minN !== undefined && !Number.isNaN(minN)) rows = rows.filter((t) => t.amount >= minN);
    if (maxN !== undefined && !Number.isNaN(maxN)) rows = rows.filter((t) => t.amount <= maxN);
    return rows;
  }, [all, q, period, walletId, category, minAmount, maxAmount]);

  const totalIn = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const exportCsv = (): void => {
    const header = ["date", "type", "category", "description", "amount", "wallet", "tags"];
    const lines = filtered.map((t) =>
      [
        formatDate(t.date),
        t.type,
        t.category,
        JSON.stringify(t.description ?? ""),
        Number(t.amount).toFixed(2),
        JSON.stringify(t.wallet?.name ?? ""),
        JSON.stringify((t.tags ?? []).join(";")),
      ].join(",")
    );
    const blob = new Blob([header.join(",") + "\n" + lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeflow-transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success("Transaction removed");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <PageLayout
      eyebrow="The ledger"
      title={
        <>
          Every <em className="italic text-primary">rupee</em>, accounted for.
        </>
      }
      subtitle="Filter by wallet, category, amount, and date. Balances stay in sync."
      actions={
        <>
          <Button variant="ghost" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New transaction
          </Button>
        </>
      }
    >
      <div className="ff-toolbar">
        <div className="ff-toolbar__row ff-toolbar__row--search">
          <div className="ff-toolbar__search">
            <Search value={q} onChange={setQ} placeholder="Search description, category, tags…" />
          </div>
          <PeriodicFilters value={period} onChange={setPeriod} />
        </div>
        <div className="ff-toolbar__filters">
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
              ...allCategories.map((c) => ({ value: c, label: c })),
            ]}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="Min amount"
            type="number"
            placeholder="0"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
          />
          <Input
            label="Max amount"
            type="number"
            placeholder="Any"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="ff-tile-grid ff-tile-grid--3">
        <Tile label="Inflow · income" value={totalIn} tone="income" />
        <Tile label="Outflow · expense" value={totalOut} tone="expense" />
        <Tile label="Net · in minus out" value={totalIn - totalOut} tone="accent" />
      </div>

      {isLoading ? (
        <LoadingOverlay rows={6} />
      ) : filtered.length === 0 ? (
        <FallBackState
          icon={Wallet}
          title="Nothing matches"
          description="Try widening filters or add a transaction."
        />
      ) : (
        <Table<Transaction>
          rowKey={(r) => r.id}
          data={filtered}
          columns={[
            {
              key: "date",
              header: "Date",
              cell: (r) => (
                <span className="font-mono text-xs text-muted">{formatDate(r.date)}</span>
              ),
            },
            {
              key: "type",
              header: "Type",
              cell: (r) => <Badge tone="muted">{r.type}</Badge>,
            },
            {
              key: "category",
              header: "Category",
              cell: (r) => {
                const def = categoryFor(r.category);
                const C = def.icon;
                return (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded-md grid place-items-center"
                      style={{ background: `${def.color}1f`, color: def.color }}
                    >
                      <C className="h-3 w-3" />
                    </span>
                    {r.category}
                  </span>
                );
              },
            },
            {
              key: "description",
              header: "Description",
              cell: (r) => (
                <span className="inline-flex items-center gap-2">
                  {r.description ?? <span className="text-muted">—</span>}
                  {r.pending && (
                    <Badge tone="gold" className="text-[10px]">
                      Syncing…
                    </Badge>
                  )}
                </span>
              ),
            },
            {
              key: "wallet",
              header: "Wallet",
              cell: (r) =>
                r.wallet ? (
                  <Badge tone="muted" className="text-[10px]">
                    {r.wallet.name}
                  </Badge>
                ) : (
                  "—"
                ),
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              cell: (r) => {
                const inflow =
                  r.type === "income" || (r.type === "transfer" && r.transferDirection === "in");
                return (
                  <span
                    className={`font-display text-base ${inflow ? "text-emerald" : "text-ink"}`}
                  >
                    {inflow ? "+" : "−"}
                    {formatPKR(r.amount, { showSymbol: false })}
                  </span>
                );
              },
            },
            {
              key: "actions",
              header: "",
              align: "right",
              cell: (r) => (
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Edit"
                    onClick={() => setEditing(r)}
                    disabled={r.type === "transfer"}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted hover:text-terra"
                    aria-label="Delete"
                    onClick={() => setDeleting(r)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="New transaction"
        description="Log income, expense, or transfer — balances adjust automatically."
      >
        <TransactionForm onDone={() => setOpen(false)} />
      </Modal>

      <CsvImportModal open={importOpen} onOpenChange={setImportOpen} />

      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Edit transaction"
        description="Income and expense only. Transfers: delete and recreate."
      >
        {editing && <TransactionForm editing={editing} onDone={() => setEditing(null)} />}
      </Modal>

      <Modal
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete transaction?"
        description="Wallet balances will be reversed automatically."
      >
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Remove this {deleting.type} of{" "}
              <strong className="text-ink">
                {formatPKR(deleting.amount, { showSymbol: false })}
              </strong>
              ?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleting(null)}
                disabled={del.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={del.isPending}
                onClick={() => void confirmDelete()}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default TransactionsView;
