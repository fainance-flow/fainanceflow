"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Wallet, Landmark, Building2, Car, Home, Shield } from "lucide-react";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import Button from "@components/common/Button";
import { useCreateAccount } from "@hooks/useAccounts";
import { walletSchema, type WalletFormValues } from "@schemas/wallet";
import { cn } from "@utils/cn";

const COLORS: string[] = [
  "#C9A961",
  "#5FAA7E",
  "#D97757",
  "#8B92BD",
  "#BD5F5F",
  "#A881D9",
  "#5F95BD",
  "#6B716D",
];

const ICONS: { key: string; label: string; Icon: typeof Wallet }[] = [
  { key: "wallet", label: "Wallet", Icon: Wallet },
  { key: "landmark", label: "Bank", Icon: Landmark },
  { key: "building-2", label: "Branch", Icon: Building2 },
  { key: "car", label: "Auto", Icon: Car },
  { key: "home", label: "Home", Icon: Home },
  { key: "shield", label: "Vault", Icon: Shield },
];

type Props = {
  onDone?: () => void;
};

const AccountForm = ({ onDone }: Props) => {
  const create = useCreateAccount();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: "",
      type: "savings",
      balance: 0,
      currency: "PKR",
      color: COLORS[0],
      icon: "wallet",
    },
  });

  const onSubmit = async (values: WalletFormValues): Promise<void> => {
    try {
      await create.mutateAsync({
        name: values.name,
        type: values.type,
        balance: values.balance,
        currency: values.currency,
        color: values.color,
        icon: values.icon,
      });
      toast.success(`Added ${values.name}`);
      onDone?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't save the wallet.";
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Wallet name"
        placeholder="HBL Savings"
        autoFocus
        error={errors.name?.message}
        {...register("name")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type"
          options={[
            { value: "bank", label: "Bank" },
            { value: "cash", label: "Cash" },
            { value: "credit", label: "Credit" },
            { value: "savings", label: "Savings" },
          ]}
          {...register("type")}
        />
        <Input
          label="Opening balance"
          type="number"
          step="0.01"
          placeholder="0"
          error={errors.balance?.message}
          {...register("balance", { valueAsNumber: true })}
        />
      </div>

      <Input
        label="Currency"
        placeholder="PKR"
        error={errors.currency?.message}
        {...register("currency")}
      />

      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">Colour</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => field.onChange(c)}
                  aria-label={`Pick colour ${c}`}
                  aria-pressed={field.value === c}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform",
                    field.value === c
                      ? "border-gold scale-110 shadow-soft"
                      : "border-line-strong hover:scale-105"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        )}
      />

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
        <Button type="button" variant="ghost" onClick={onDone} disabled={create.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" loading={create.isPending}>
          Add wallet
        </Button>
      </div>
    </form>
  );
};

export default AccountForm;
