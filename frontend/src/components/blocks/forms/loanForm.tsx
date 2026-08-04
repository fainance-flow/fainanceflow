"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import Button from "@components/common/Button";
import DatePicker from "@components/common/DatePicker";
import { loanSchema, type LoanFormValues } from "@schemas/loan";
import { useCreateLoan, useUpdateLoan } from "@hooks/useLoans";
import type { Loan } from "@utils/types";

type Props = {
  editing?: Loan | null;
  onDone?: () => void;
};

const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const LoanForm = ({ editing, onDone }: Props) => {
  const create = useCreateLoan();
  const update = useUpdateLoan();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      name: "",
      principalAmount: 0,
      remainingBalance: 0,
      interestRate: 0,
      emiAmount: 1,
      nextDueDate: todayIso(),
      lenderName: "",
      type: "taken",
    },
  });

  useEffect(() => {
    if (!editing) return;
    reset({
      name: editing.name,
      principalAmount: editing.principalAmount,
      remainingBalance: editing.remainingBalance,
      interestRate: editing.interestRate,
      emiAmount: editing.emiAmount,
      nextDueDate: editing.nextDueDate.slice(0, 10),
      lenderName: editing.lenderName,
      type: editing.type,
    });
  }, [editing, reset]);

  const onSubmit = async (values: LoanFormValues): Promise<void> => {
    const nextDueDate = new Date(values.nextDueDate).toISOString();
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, patch: { ...values, nextDueDate } });
        toast.success("Loan updated");
      } else {
        await create.mutateAsync({ ...values, nextDueDate });
        toast.success("Loan added");
      }
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Loan name" {...register("name")} error={errors.name?.message} />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Principal"
          type="number"
          step="0.01"
          {...register("principalAmount", { valueAsNumber: true })}
          error={errors.principalAmount?.message}
        />
        <Input
          label="Remaining balance"
          type="number"
          step="0.01"
          {...register("remainingBalance", { valueAsNumber: true })}
          error={errors.remainingBalance?.message}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Interest rate % (APR)"
          type="number"
          step="0.01"
          {...register("interestRate", { valueAsNumber: true })}
          error={errors.interestRate?.message}
        />
        <Input
          label="EMI amount"
          type="number"
          step="0.01"
          {...register("emiAmount", { valueAsNumber: true })}
          error={errors.emiAmount?.message}
        />
      </div>
      <Controller
        control={control}
        name="nextDueDate"
        render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} label="Next due date" />}
      />
      <Input label="Lender / borrower name" {...register("lenderName")} error={errors.lenderName?.message} />
      <Select
        label="Type"
        options={[
          { value: "taken", label: "Taken (you owe)" },
          { value: "given", label: "Given (you lent)" },
        ]}
        {...register("type")}
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

export default LoanForm;
