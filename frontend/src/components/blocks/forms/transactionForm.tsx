"use client";

import { useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, Repeat } from "lucide-react";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import Button from "@components/common/Button";
import DatePicker from "@components/common/DatePicker";
import FallBackState from "@components/common/FallBackState";
import { useAccounts } from "@hooks/useAccounts";
import { useCreateTransaction, useUpdateTransaction } from "@hooks/useTransactions";
import { transactionSchema, type TransactionFormValues } from "@schemas/transaction";
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@utils/categories";
import { formatPKR } from "@utils/currency";
import { cn } from "@utils/cn";
import type { TransactionType, Transaction } from "@utils/types";

const TYPE_META: Record<
  TransactionType,
  { label: string; Icon: typeof ArrowDownRight; tone: string }
> = {
  income: { label: "Income", Icon: ArrowDownRight, tone: "emerald" },
  expense: { label: "Expense", Icon: ArrowUpRight, tone: "terra" },
  transfer: { label: "Transfer", Icon: Repeat, tone: "gold" },
};

const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

type Props = {
  defaultType?: TransactionType;
  lockType?: boolean;
  editing?: Transaction | null;
  onDone?: () => void;
};

const TransactionForm = ({ defaultType = "expense", lockType = false, editing, onDone }: Props) => {
  const accountsQuery = useAccounts();
  const wallets = accountsQuery.data ?? [];
  const create = useCreateTransaction();
  const update = useUpdateTransaction();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      amount: 0,
      walletId: "",
      toWalletId: "",
      category:
        defaultType === "income" ? "Salary" : defaultType === "transfer" ? "Transfer" : "Food",
      description: "",
      date: todayIso(),
      tagInput: "",
    },
  });

  useEffect(() => {
    if (!editing) return;
    reset({
      type: editing.type,
      amount: editing.amount,
      walletId: editing.wallet?.id ?? "",
      toWalletId: "",
      category: editing.category,
      description: editing.description ?? "",
      date: editing.date.slice(0, 10),
      tagInput: (editing.tags ?? []).join(", "),
    });
  }, [editing, reset]);

  const currentType = watch("type");

  const categoryOptions = useMemo(() => {
    if (currentType === "income") {
      return INCOME_CATEGORIES.map((k) => ({ value: k, label: CATEGORIES[k]?.label ?? k }));
    }
    if (currentType === "transfer") {
      return [{ value: "Transfer", label: "Transfer" }];
    }
    return EXPENSE_CATEGORIES.map((k) => ({ value: k, label: CATEGORIES[k]?.label ?? k }));
  }, [currentType]);

  const onTypeChange = (next: TransactionType): void => {
    setValue("type", next, { shouldValidate: true });
    if (next === "income") setValue("category", "Salary");
    else if (next === "transfer") setValue("category", "Transfer");
    else setValue("category", "Food");
  };

  if (accountsQuery.isLoading) {
    return <p className="text-sm text-muted py-4">Loading your wallets…</p>;
  }

  if (wallets.length === 0) {
    return (
      <FallBackState
        title="No wallets yet"
        description="Add a wallet before you can log a transaction."
      />
    );
  }

  if (editing?.type === "transfer") {
    return (
      <FallBackState
        title="Transfers can't be edited"
        description="Delete the transfer from your ledger and create a new one if you need to change it."
      />
    );
  }

  const onSubmit = async (values: TransactionFormValues): Promise<void> => {
    const dateIso = new Date(values.date).toISOString();
    const tags = (values.tagInput ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editing && editing.type !== "transfer") {
        await update.mutateAsync({
          id: editing.id,
          payload: {
            walletId: values.walletId,
            type: values.type,
            amount: values.amount,
            category: values.category,
            description: values.description?.trim() ? values.description.trim() : undefined,
            date: dateIso,
            tags,
          },
        });
        toast.success("Transaction updated");
      } else {
        await create.mutateAsync({
          walletId: values.walletId,
          toWalletId: values.type === "transfer" ? values.toWalletId : undefined,
          type: values.type,
          amount: values.amount,
          category: values.category,
          description: values.description?.trim() ? values.description.trim() : undefined,
          date: dateIso,
          tags,
        });
        const meta = TYPE_META[values.type];
        toast.success(`Logged ${meta.label.toLowerCase()} · ${formatPKR(values.amount)}`);
      }
      onDone?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't save the transaction.";
      toast.error(msg);
    }
  };

  const busy = create.isPending || update.isPending;
  const hideTypeToggle = lockType || !!editing;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!hideTypeToggle && (
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl border border-line-strong bg-surface-2/40">
              {(Object.keys(TYPE_META) as TransactionType[]).map((t) => {
                const { label, Icon, tone } = TYPE_META[t];
                const active = field.value === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onTypeChange(t)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors",
                      active
                        ? tone === "emerald"
                          ? "bg-emerald/15 text-emerald"
                          : tone === "terra"
                            ? "bg-terra/15 text-terra"
                            : "bg-gold/15 text-gold"
                        : "text-muted hover:text-ink"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          placeholder="0"
          autoFocus
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DatePicker value={field.value} onChange={field.onChange} label="Date" />
          )}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Select
          label={currentType === "transfer" ? "From wallet" : "Wallet"}
          options={[
            { value: "", label: "— Pick a wallet —" },
            ...wallets.map((w) => ({ value: w.id, label: w.name })),
          ]}
          {...register("walletId")}
        />
        {errors.walletId && (
          <p className="font-mono text-[10px] tracking-wide text-terra">
            {errors.walletId.message}
          </p>
        )}
      </div>

      {currentType === "transfer" && !editing && (
        <div className="flex flex-col gap-1">
          <Select
            label="To wallet"
            options={[
              { value: "", label: "— Destination —" },
              ...wallets.map((w) => ({ value: w.id, label: w.name })),
            ]}
            {...register("toWalletId")}
          />
          {errors.toWalletId && (
            <p className="font-mono text-[10px] tracking-wide text-terra">
              {errors.toWalletId.message}
            </p>
          )}
        </div>
      )}

      <Select
        label="Category"
        options={categoryOptions}
        {...register("category")}
        disabled={currentType === "transfer" || !!editing}
      />

      <Input label="Description (optional)" placeholder="Note…" {...register("description")} />

      <Input
        label="Tags (optional, comma-separated)"
        placeholder="trip, tax"
        {...register("tagInput")}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" loading={busy}>
          {editing ? "Save changes" : "Save transaction"}
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;
