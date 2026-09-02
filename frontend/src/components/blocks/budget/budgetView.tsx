"use client";

import { useState } from "react";
import { PieChart, Plus, Pencil, Trash2 } from "lucide-react";
import PageLayout from "@components/common/PageLayout";
import Button from "@components/common/Button";
import Badge from "@components/common/Badge";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import FallBackState from "@components/common/FallBackState";
import LoadingOverlay from "@components/common/LoadingOverlay";
import BudgetForm from "@components/blocks/forms/budgetForm";
import { useBudgetStatus, useUpdateBudget, useDeleteBudget } from "@hooks/useBudgets";
import { categoryFor } from "@utils/categories";
import { formatPKR } from "@utils/currency";
import { monthName } from "@utils/date";
import type { BudgetStatus } from "@utils/types";
import { toast } from "sonner";

const BudgetView = () => {
  const now = new Date();
  const [month] = useState<number>(now.getMonth() + 1);
  const [year] = useState<number>(now.getFullYear());
  const [open, setOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<BudgetStatus | null>(null);
  const [editLimit, setEditLimit] = useState<string>("");
  const [deleting, setDeleting] = useState<BudgetStatus | null>(null);

  const { data, isLoading } = useBudgetStatus(month, year);
  const update = useUpdateBudget();
  const del = useDeleteBudget();
  const items = data?.status ?? [];

  const openEdit = (b: BudgetStatus): void => {
    setEditing(b);
    setEditLimit(String(b.limit));
  };

  const saveEdit = async (): Promise<void> => {
    if (!editing) return;
    const n = Number(editLimit);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a positive limit");
      return;
    }
    try {
      await update.mutateAsync({ id: editing.id, monthlyLimit: n });
      toast.success("Budget updated");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success("Budget removed");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <PageLayout
      eyebrow={`${monthName(month)} · ${year}`}
      title={
        <>
          Your <em className="italic text-gold">budget</em>, on a page.
        </>
      }
      subtitle="One card per category. Green is safe, yellow means slow down, red means you've crossed the line."
      actions={
        <Button variant="gold" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New budget
        </Button>
      }
    >
      {isLoading ? (
        <LoadingOverlay rows={4} />
      ) : items.length === 0 ? (
        <FallBackState
          icon={PieChart}
          title="No budgets for this month"
          description="Set a monthly limit for any category — food, transport, shopping — and we'll track it."
          action={
            <Button variant="gold" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add a budget
            </Button>
          }
        />
      ) : (
        <div className="ff-card-grid ff-stagger">
          {items.map((b) => {
            const def = categoryFor(b.category);
            const C = def.icon;
            const stateBadge =
              b.state === "over"
                ? { tone: "terra" as const, label: "Over limit" }
                : b.state === "warn"
                ? { tone: "gold" as const, label: "Nearing limit" }
                : { tone: "emerald" as const, label: "On track" };

            return (
              <article key={b.id} className="rounded-2xl border border-line-strong bg-surface p-6 group">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="h-10 w-10 rounded-lg grid place-items-center"
                    style={{ background: `${def.color}1a`, color: def.color }}
                  >
                    <C className="h-5 w-5" />
                  </span>
                  <Badge tone={stateBadge.tone} dot>
                    {stateBadge.label}
                  </Badge>
                </div>
                <h3 className="font-display text-xl">{b.category}</h3>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
                  Spent {formatPKR(b.spent, { showSymbol: false })} of{" "}
                  {formatPKR(b.limit, { showSymbol: false })}
                </p>
                <div className={`ff-progress mt-4 ${
                  b.state === "over" ? "ff-progress--danger"
                  : b.state === "warn" ? "ff-progress--warning"
                  : "ff-progress--success"
                }`}>
                  <span
                    className="ff-progress__fill"
                    style={{ width: `${Math.min(b.pct, 100)}%` }}
                  />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    {b.pct}% used
                  </span>
                  <span className="font-display text-lg tabular">
                    {b.remaining > 0 ? (
                      <>
                        {formatPKR(b.remaining, { showSymbol: false })}
                        <span className="text-xs text-muted ml-1">left</span>
                      </>
                    ) : (
                      <span className="text-terra">
                        over by {formatPKR(b.spent - b.limit, { showSymbol: false })}
                      </span>
                    )}
                  </span>
                </div>
                {b.state === "warn" && (
                  <p className="font-mono text-[9px] text-gold mt-2 uppercase tracking-wide">
                    Over 80% of this budget used
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(b)}>
                    <Pencil className="h-3 w-3" />
                    Edit limit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-terra"
                    onClick={() => setDeleting(b)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="New budget"
        description="Set a monthly spending limit for a category."
      >
        <BudgetForm defaultMonth={month} defaultYear={year} onDone={() => setOpen(false)} />
      </Modal>

      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Edit budget limit"
        description={editing ? `Category · ${editing.category}` : ""}
      >
        {editing && (
          <div className="space-y-4">
            <Input
              label="Monthly limit"
              type="number"
              step="100"
              value={editLimit}
              onChange={(e) => setEditLimit(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)} disabled={update.isPending}>
                Cancel
              </Button>
              <Button type="button" variant="gold" loading={update.isPending} onClick={() => void saveEdit()}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete budget?"
        description="You can recreate it later for the same month."
      >
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Remove the <strong className="text-ink">{deleting.category}</strong> budget for{" "}
              {monthName(month)} {year}?
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDeleting(null)} disabled={del.isPending}>
                Cancel
              </Button>
              <Button type="button" variant="danger" loading={del.isPending} onClick={() => void confirmDelete()}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default BudgetView;
