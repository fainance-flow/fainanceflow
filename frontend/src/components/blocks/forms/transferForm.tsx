"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import Button from "@components/common/Button";
import DatePicker from "@components/common/DatePicker";
import { useAccounts } from "@hooks/useAccounts";
import { useCreateTransaction } from "@hooks/useTransactions";

const transferSchema = z
  .object({
    fromWalletId: z.string().min(1, "Pick source"),
    toWalletId: z.string().min(1, "Pick destination"),
    amount: z.number().positive("Amount must be positive"),
    date: z.string().min(1),
    description: z.string().max(280).optional(),
  })
  .refine((d) => d.fromWalletId !== d.toWalletId, { message: "Wallets must differ", path: ["toWalletId"] });

type TransferValues = z.infer<typeof transferSchema>;

const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type Props = { onDone?: () => void };

const TransferForm = ({ onDone }: Props) => {
  const { data: wallets = [] } = useAccounts();
  const create = useCreateTransaction();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromWalletId: "",
      toWalletId: "",
      amount: 0,
      date: todayIso(),
      description: "",
    },
  });

  const onSubmit = async (values: TransferValues): Promise<void> => {
    try {
      await create.mutateAsync({
        walletId: values.fromWalletId,
        toWalletId: values.toWalletId,
        type: "transfer",
        amount: values.amount,
        category: "Transfer",
        description: values.description?.trim() || undefined,
        date: new Date(values.date).toISOString(),
      });
      toast.success("Transfer completed");
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transfer failed");
    }
  };

  const opts = [{ value: "", label: "— Select —" }, ...wallets.map((w) => ({ value: w.id, label: w.name }))];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select label="From" options={opts} {...register("fromWalletId")} />
      {errors.fromWalletId && (
        <p className="text-[10px] font-mono text-terra">{errors.fromWalletId.message}</p>
      )}
      <Select label="To" options={opts} {...register("toWalletId")} />
      {errors.toWalletId && <p className="text-[10px] font-mono text-terra">{errors.toWalletId.message}</p>}

      <Input
        label="Amount"
        type="number"
        step="0.01"
        error={errors.amount?.message}
        {...register("amount", { valueAsNumber: true })}
      />

      <Controller
        control={control}
        name="date"
        render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} label="Date" />}
      />

      <Input label="Note (optional)" {...register("description")} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={create.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" loading={create.isPending}>
          Transfer
        </Button>
      </div>
    </form>
  );
};

export default TransferForm;
