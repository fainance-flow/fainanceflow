"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Wallet, Landmark, Building2, Car, Home, Shield, Lock, LockOpen, Eye, EyeOff } from "lucide-react";
import Input from "@components/common/Input";
import Select from "@components/common/Select";
import Button from "@components/common/Button";
import { useUpdateAccount } from "@hooks/useAccounts";
import { walletSchema, type WalletFormValues } from "@schemas/wallet";
import { cn } from "@utils/cn";
import type { Wallet as WalletT } from "@utils/types";

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
  wallet: WalletT;
  onDone?: () => void;
};

const WalletEditForm = ({ wallet, onDone }: Props) => {
  const update = useUpdateAccount();
  const [newPin, setNewPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [clearPin, setClearPin] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      currency: wallet.currency,
      color: wallet.color,
      icon: wallet.icon,
    },
  });

  const onSubmit = async (values: WalletFormValues): Promise<void> => {
    try {
      const pinPayload = clearPin ? "" : newPin.trim() || undefined;
      // Adjust openingBalance so that: openingBalance + existing_transactions_impact = desired balance
      const transactionsImpact = wallet.balance - wallet.openingBalance;
      const adjustedOpeningBalance = values.balance - transactionsImpact;
      await update.mutateAsync({
        id: wallet.id,
        payload: {
          name: values.name,
          type: values.type,
          balance: adjustedOpeningBalance,
          currency: values.currency,
          color: values.color,
          icon: values.icon,
          ...(pinPayload !== undefined ? { pin: pinPayload } : {}),
        },
      });
      toast.success("Wallet updated");
      onDone?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't update wallet.";
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Wallet name" error={errors.name?.message} {...register("name")} />

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
          label="Balance"
          type="number"
          step="0.01"
          error={errors.balance?.message}
          {...register("balance", { valueAsNumber: true })}
        />
      </div>

      <Input label="Currency" error={errors.currency?.message} {...register("currency")} />

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
                  aria-pressed={field.value === c}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform",
                    field.value === c ? "border-gold scale-110 shadow-soft" : "border-line-strong hover:scale-105"
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

      {/* PIN protection */}
      <div className="space-y-2 pt-1">
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted flex items-center gap-1.5">
          {wallet.hasPin ? <Lock className="h-3 w-3 text-primary" /> : <LockOpen className="h-3 w-3" />}
          Wallet PIN {wallet.hasPin ? "(currently set)" : "(optional)"}
        </p>

        {wallet.hasPin && (
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted">
            <input
              type="checkbox"
              checked={clearPin}
              onChange={(e) => { setClearPin(e.target.checked); setNewPin(""); }}
              className="accent-terra"
            />
            Remove existing PIN
          </label>
        )}

        {!clearPin && (
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              maxLength={6}
              placeholder={wallet.hasPin ? "Enter new PIN to change…" : "Set a 46 digit PIN…"}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full h-10 px-3 pr-10 text-sm rounded-md border border-line-strong bg-canvas text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono tracking-widest"
            />
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
              tabIndex={-1}
            >
              {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={update.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
};

export default WalletEditForm;
