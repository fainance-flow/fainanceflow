"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Target, Plane, Car, Home, GraduationCap, Heart } from "lucide-react";
import Input from "@components/common/Input";
import Button from "@components/common/Button";
import DatePicker from "@components/common/DatePicker";
import { useCreateGoal, useUpdateGoal } from "@hooks/useGoals";
import { goalSchema, type GoalFormValues } from "@schemas/goal";
import { cn } from "@utils/cn";
import type { Goal } from "@utils/types";

const ICONS: { key: string; label: string; Icon: typeof Target }[] = [
  { key: "target", label: "Goal", Icon: Target },
  { key: "car", label: "Vehicle", Icon: Car },
  { key: "home", label: "Home", Icon: Home },
  { key: "wallet", label: "Fund", Icon: Plane },
  { key: "landmark", label: "Education", Icon: GraduationCap },
  { key: "shield", label: "Safety", Icon: Heart },
];

type Props = {
  onDone?: () => void;
  goal?: Goal | null;
};

const GoalForm = ({ onDone, goal }: Props) => {
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const isEdit = Boolean(goal);
  const pending = isEdit ? update.isPending : create.isPending;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title ?? "",
      targetAmount: goal ? Number(goal.targetAmount) : 0,
      deadline: goal?.deadline ?? "",
      icon: goal?.icon ?? "target",
    },
  });

  const onSubmit = async (values: GoalFormValues): Promise<void> => {
    try {
      const payload = {
        title: values.title,
        targetAmount: values.targetAmount,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
        icon: values.icon ?? "target",
      };

      if (isEdit && goal) {
        await update.mutateAsync({ id: goal.id, payload });
        toast.success(`Goal updated · ${values.title}`);
      } else {
        await create.mutateAsync(payload);
        toast.success(`Goal added · ${values.title}`);
      }
      onDone?.();
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (isEdit ? "Couldn't update the goal." : "Couldn't save the goal.")
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="What are you saving for?"
        placeholder="Emergency fund, new car, Umrah…"
        autoFocus
        error={errors.title?.message}
        {...register("title")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Target amount (PKR)"
          type="number"
          step="1000"
          placeholder="500000"
          error={errors.targetAmount?.message}
          {...register("targetAmount", { valueAsNumber: true })}
        />
        <Controller
          control={control}
          name="deadline"
          render={({ field }) => (
            <DatePicker
              value={field.value ?? ""}
              onChange={field.onChange}
              label="Deadline (optional)"
            />
          )}
        />
      </div>

      <Controller
        control={control}
        name="icon"
        render={({ field }) => (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">Icon</p>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map(({ key, label, Icon }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => field.onChange(key)}
                  title={label}
                  aria-pressed={field.value === key}
                  className={cn(
                    "h-10 rounded-lg grid place-items-center border transition-all",
                    field.value === key
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-line-strong text-muted hover:border-gold/40 hover:text-ink"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        )}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" loading={pending}>
          {isEdit ? "Save changes" : "Add goal"}
        </Button>
      </div>
    </form>
  );
};

export default GoalForm;
