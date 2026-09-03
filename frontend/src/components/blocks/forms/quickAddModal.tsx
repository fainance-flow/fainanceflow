"use client";

import { useState, useEffect } from "react";
import { ArrowDownRight, ArrowUpRight, Repeat, PieChart, Wallet } from "lucide-react";
import Modal from "@components/common/Modal";
import AccountForm from "@components/blocks/forms/accountForm";
import TransactionForm from "@components/blocks/forms/transactionForm";
import BudgetForm from "@components/blocks/forms/budgetForm";
import { cn } from "@utils/cn";

export type QuickAddKind = "expense" | "income" | "transfer" | "budget" | "account";

type TileDef = {
  key: QuickAddKind;
  label: string;
  Icon: typeof ArrowDownRight;
  tone: "emerald" | "terra" | "gold" | "slate";
  hint: string;
};

const TILES: TileDef[] = [
  { key: "expense", label: "Expense", Icon: ArrowUpRight, tone: "terra", hint: "Money out" },
  { key: "income", label: "Income", Icon: ArrowDownRight, tone: "emerald", hint: "Money in" },
  { key: "transfer", label: "Transfer", Icon: Repeat, tone: "gold", hint: "Between wallets" },
  { key: "budget", label: "Budget", Icon: PieChart, tone: "slate", hint: "Monthly limit" },
  { key: "account", label: "Wallet", Icon: Wallet, tone: "slate", hint: "New wallet" },
];

const TONE_STYLES: Record<TileDef["tone"], { active: string; idle: string }> = {
  emerald: {
    active: "border-emerald bg-emerald/12 text-emerald",
    idle: "border-line-strong text-muted hover:border-emerald/40 hover:text-emerald",
  },
  terra: {
    active: "border-terra bg-terra/12 text-terra",
    idle: "border-line-strong text-muted hover:border-terra/40 hover:text-terra",
  },
  gold: {
    active: "border-gold bg-gold/12 text-gold",
    idle: "border-line-strong text-muted hover:border-gold/40 hover:text-gold",
  },
  slate: {
    active: "border-ink/60 bg-surface-2 text-ink",
    idle: "border-line-strong text-muted hover:border-ink/40 hover:text-ink",
  },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: QuickAddKind;
};

const QuickAddModal = ({ open, onOpenChange, initial = "expense" }: Props) => {
  const [active, setActive] = useState<QuickAddKind>(initial);

  useEffect(() => {
    if (open) setActive(initial);
  }, [open, initial]);

  const close = (): void => onOpenChange(false);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Quick add"
      description="One place to log everything that moved your money."
    >
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
        {TILES.map(({ key, label, Icon, tone, hint }) => {
          const isActive = active === key;
          const styles = TONE_STYLES[tone];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              aria-pressed={isActive}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                isActive ? styles.active : styles.idle
              )}
            >
              <Icon className="h-4 w-4 mb-2" />
              <p className="text-xs font-medium text-ink leading-tight">{label}</p>
              <p className="font-mono text-[9px] tracking-[0.12em] uppercase opacity-70 mt-0.5">
                {hint}
              </p>
            </button>
          );
        })}
      </div>

      <div className="border-t border-line-strong pt-5">
        {active === "expense" && <TransactionForm defaultType="expense" lockType onDone={close} />}
        {active === "income" && <TransactionForm defaultType="income" lockType onDone={close} />}
        {active === "transfer" && (
          <TransactionForm defaultType="transfer" lockType onDone={close} />
        )}
        {active === "budget" && <BudgetForm onDone={close} />}
        {active === "account" && <AccountForm onDone={close} />}
      </div>
    </Modal>
  );
};

export default QuickAddModal;
