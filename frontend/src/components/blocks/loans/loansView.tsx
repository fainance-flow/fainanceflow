"use client";

import { useState } from "react";
import { Plus, Landmark, Wallet } from "lucide-react";
import PageLayout from "@components/common/PageLayout";
import Button from "@components/common/Button";
import Modal from "@components/common/Modal";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import FallBackState from "@components/common/FallBackState";
import LoadingOverlay from "@components/common/LoadingOverlay";
import LoanForm from "@components/blocks/forms/loanForm";
import { useLoans, useDeleteLoan, usePayLoan } from "@hooks/useLoans";
import { useAccounts } from "@hooks/useAccounts";
import { payoffMonthsEstimate } from "@services/loans";
import { formatPKR } from "@utils/currency";
import { format } from "date-fns";
import type { Loan } from "@utils/types";
import { toast } from "sonner";

const LoansView = () => {
  const { data, isLoading } = useLoans();
  const { data: wallets = [] } = useAccounts();
  const remove = useDeleteLoan();
  const payLoan = usePayLoan();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [paying, setPaying] = useState<Loan | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payWallet, setPayWallet] = useState<string>("");
  const [payDate, setPayDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const loans = data ?? [];

  const totalOwed = loans
    .filter((L) => L.type === "taken")
    .reduce((s, L) => s + L.remainingBalance, 0);
  const totalLent = loans
    .filter((L) => L.type === "given")
    .reduce((s, L) => s + L.remainingBalance, 0);
  const monthlyEmi = loans
    .filter((L) => L.type === "taken" && L.remainingBalance > 0)
    .reduce((s, L) => s + L.emiAmount, 0);

  const submitPay = async (): Promise<void> => {
    if (!paying || !payWallet) {
      toast.error("Pick a wallet");
      return;
    }
    const amt = Number(payAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await payLoan.mutateAsync({
        loanId: paying.id,
        walletId: payWallet,
        amount: amt,
        date: new Date(payDate).toISOString(),
      });
      toast.success("Payment recorded");
      setPaying(null);
      setPayAmount("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    }
  };

  const onDelete = async (id: string): Promise<void> => {
    if (!confirm("Delete this loan record?")) return;
    try {
      await remove.mutateAsync(id);
      toast.success("Loan removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <PageLayout
      eyebrow="Borrow & lend"
      title={
        <>
          <em className="italic text-gold">Loans</em>
        </>
      }
      subtitle="Track EMIs, remaining balance, and quick payoff estimates."
      actions={
        <Button variant="gold" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add loan
        </Button>
      }
    >
      {loans.length > 0 && (
        <div className="ff-tile-grid ff-tile-grid--3">
          <div className="ff-tile ff-tile--expense">
            <div className="ff-tile__head">
              <span className="ff-tile__label">You owe · total</span>
            </div>
            <p className="ff-tile__value">
              <span className="currency">₨</span>
              {formatPKR(totalOwed, { showSymbol: false })}
            </p>
            <span className="ff-tile__sub">
              {loans.filter((L) => L.type === "taken" && L.remainingBalance > 0).length} active
              loans
            </span>
          </div>
          <div className="ff-tile ff-tile--income">
            <div className="ff-tile__head">
              <span className="ff-tile__label">You lent · receivable</span>
            </div>
            <p className="ff-tile__value">
              <span className="currency">₨</span>
              {formatPKR(totalLent, { showSymbol: false })}
            </p>
            <span className="ff-tile__sub">
              {loans.filter((L) => L.type === "given" && L.remainingBalance > 0).length} outstanding
            </span>
          </div>
          <div className="ff-tile ff-tile--accent">
            <div className="ff-tile__head">
              <span className="ff-tile__label">Monthly EMI</span>
            </div>
            <p className="ff-tile__value">
              <span className="currency">₨</span>
              {formatPKR(monthlyEmi, { showSymbol: false })}
            </p>
            <span className="ff-tile__sub">Across active loans</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingOverlay rows={4} />
      ) : loans.length === 0 ? (
        <FallBackState
          icon={Landmark}
          title="No loans yet"
          description="Log a home loan, car loan, or money you lent to someone."
          action={
            <Button variant="gold" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add loan
            </Button>
          }
        />
      ) : (
        <div className="ff-card-grid ff-card-grid--2 ff-stagger">
          {loans.map((L) => {
            const est = payoffMonthsEstimate(L.remainingBalance, L.emiAmount);
            return (
              <article key={L.id} className="rounded-2xl border border-line-strong bg-surface p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-xl">{L.name}</h3>
                    <p className="font-mono text-[10px] uppercase text-muted mt-1">
                      {L.type === "taken" ? "You owe" : "You lent"} · {L.lenderName}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Remaining</dt>
                    <dd className="font-display tabular">{formatPKR(L.remainingBalance)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">EMI</dt>
                    <dd className="tabular">{formatPKR(L.emiAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Rate</dt>
                    <dd>{L.interestRate}% APR</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Next due</dt>
                    <dd>{format(new Date(L.nextDueDate), "dd MMM yyyy")}</dd>
                  </div>
                  {est != null && L.remainingBalance > 0 && (
                    <div className="flex justify-between text-gold">
                      <dt>Payoff ~</dt>
                      <dd>{est} months at current EMI</dd>
                    </div>
                  )}
                </dl>
                <div className="flex flex-wrap gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPaying(L);
                      setPayAmount(String(Math.min(L.emiAmount, L.remainingBalance)));
                      setPayWallet(wallets[0]?.id ?? "");
                    }}
                    disabled={L.remainingBalance <= 0}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Make payment
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(L)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-terra"
                    onClick={() => void onDelete(L.id)}
                  >
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
        title="New loan"
        description="Principal, EMI, and who holds the note."
      >
        <LoanForm onDone={() => setOpen(false)} />
      </Modal>

      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title="Edit loan"
        description="Adjust terms as they change."
      >
        {editing && <LoanForm editing={editing} onDone={() => setEditing(null)} />}
      </Modal>

      <Modal
        open={!!paying}
        onOpenChange={(v) => !v && setPaying(null)}
        title="Record loan payment"
        description="Deducts from the wallet you pick and reduces remaining balance."
      >
        {paying && (
          <div className="space-y-4">
            <Select
              label="Wallet"
              options={wallets.map((w) => ({ value: w.id, label: w.name }))}
              value={payWallet}
              onChange={(e) => setPayWallet(e.target.value)}
            />
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <div>
              <label className="font-mono text-[10px] uppercase text-muted block mb-1">Date</label>
              <input
                type="date"
                className="h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setPaying(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="gold"
                loading={payLoan.isPending}
                onClick={() => void submitPay()}
              >
                Pay
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};

export default LoansView;
