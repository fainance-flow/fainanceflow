"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import Button from "@components/common/Button";
import { useCreateBudget } from "@hooks/useBudgets";
import { budgetSchema, type BudgetFormValues } from "@schemas/budget";
import { EXPENSE_CATEGORIES, CATEGORIES } from "@utils/categories";
import { monthName } from "@utils/date";

const now = new Date();

type Props = {
  defaultMonth?: number;
  defaultYear?: number;
  onDone?: () => void;
};

const BudgetForm = ({
  defaultMonth = now.getMonth() + 1,
  defaultYear = now.getFullYear(),
  onDone,
}: Props) => {
  const create = useCreateBudget();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: EXPENSE_CATEGORIES[0] ?? "Food",
      monthlyLimit: 0,
      month: defaultMonth,
      year: defaultYear,
    },
  });

  const yearOptions = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i).map((y) => ({
    value: String(y),
    label: String(y),
  }));
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
    value: String(m),
    label: monthName(m),
  }));

  const onSubmit = async (values: BudgetFormValues): Promise<void> => {
    try {
      await create.mutateAsync(values);
      toast.success(
        `Budget set · ${values.category} · ${monthName(values.month)} ${values.year}`
      );
      onDone?.();
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Couldn't save the budget."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Category"
        options={EXPENSE_CATEGORIES.map((k) => ({
          value: k,
          label: CATEGORIES[k]?.label ?? k,
        }))}
        {...register("category")}
      />

      <Input
        label="Monthly limit (PKR)"
        type="number"
        step="100"
        placeholder="20000"
        autoFocus
        error={errors.monthlyLimit?.message}
        {...register("monthlyLimit", { valueAsNumber: true })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Month"
          options={monthOptions}
          {...register("month", { valueAsNumber: true })}
        />
        <Select
          label="Year"
          options={yearOptions}
          {...register("year", { valueAsNumber: true })}
        />
      </div>

      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
        Tip · saving the same category & month again will update the limit.
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={create.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" loading={create.isPending}>
          Save budget
        </Button>
      </div>
    </form>
  );
};

export default BudgetForm;
