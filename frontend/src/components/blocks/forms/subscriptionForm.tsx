"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import Button from "@components/common/Button";
import DatePicker from "@components/common/DatePicker";
import FallBackState from "@components/common/FallBackState";
import { useAccounts } from "@hooks/useAccounts";
import { useCreateSubscription, useUpdateSubscription } from "@hooks/useSubscriptions";
import { subscriptionSchema, type SubscriptionFormValues } from "@schemas/subscription";
import { EXPENSE_CATEGORIES, CATEGORIES } from "@utils/categories";
import type { Subscription } from "@utils/types";

type Props = {
  editing?: Subscription | null;
  onDone?: () => void;
};

const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const SubscriptionForm = ({ editing, onDone }: Props) => {
  const { data: wallets = [], isLoading } = useAccounts();
  const create = useCreateSubscription();
  const update = useUpdateSubscription();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      amount: 0,
      billingCycle: "monthly",
      nextRenewal: todayIso(),
      category: "Bills",
      walletId: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (!editing) return;
    reset({
      name: editing.name,
      amount: editing.amount,
      billingCycle: editing.billingCycle,
      nextRenewal: editing.nextRenewal.slice(0, 10),
      category: editing.category,
      walletId: editing.walletId,
      status: editing.status,
    });
  }, [editing, reset]);

  if (isLoading) return <p className="text-sm text-muted py-4">Loading wallets…</p>;
  if (wallets.length === 0) {
    return <FallBackState title="Add a wallet first" description="Subscriptions debit a wallet when marked paid." />;
  }

  const onSubmit = async (values: SubscriptionFormValues): Promise<void> => {
    const nextRenewal = new Date(values.nextRenewal).toISOString();
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          patch: { ...values, nextRenewal },
        });
        toast.success("Subscription updated");
      } else {
        await create.mutateAsync({ ...values, nextRenewal });
        toast.success("Subscription added");
      }
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name" {...register("name")} error={errors.name?.message} />
      <Input
        label="Amount"
        type="number"
        step="0.01"
        {...register("amount", { valueAsNumber: true })}
        error={errors.amount?.message}
      />
      <Select
        label="Billing cycle"
        options={[
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "yearly", label: "Yearly" },
        ]}
        {...register("billingCycle")}
      />
      <Controller
        control={control}
        name="nextRenewal"
        render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} label="Next renewal" />}
      />
      <Select
        label="Category"
        options={EXPENSE_CATEGORIES.map((k) => ({ value: k, label: CATEGORIES[k]?.label ?? k }))}
        {...register("category")}
      />
      <Select
        label="Wallet"
        options={[{ value: "", label: "— Pick wallet —" }, ...wallets.map((w) => ({ value: w.id, label: w.name }))]}
        {...register("walletId")}
      />
      {errors.walletId && <p className="text-terra text-xs">{errors.walletId.message}</p>}
      <Select
        label="Status"
        options={[
          { value: "active", label: "Active" },
          { value: "paused", label: "Paused" },
          { value: "cancelled", label: "Cancelled" },
        ]}
        {...register("status")}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" loading={busy}>
          {editing ? "Save" : "Add"}
        </Button>
      </div>
    </form>
  );
};

export default SubscriptionForm;
