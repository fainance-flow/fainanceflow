import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import Ionicons from "@expo/vector-icons/Ionicons";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { createAccount, fetchAccounts } from "@/services/accounts";
import { createBudget } from "@/services/budgets";
import { createTransaction, transferFunds } from "@/services/transactions";
import type { WalletType } from "@/utils/types";
import { colors, radii, spacing, typography } from "@/constants/theme";

export type QuickAddKind = "expense" | "income" | "transfer" | "budget" | "account";

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: QuickAddKind;
};

type TxForm = {
  bankAccountId: string;
  amount: string;
  category: string;
  description: string;
  toBankAccountId: string;
};

type BudgetFormValues = { category: string; monthlyLimit: string };
type AccountFormValues = { name: string; balance: string; type: WalletType };

const TILES: {
  key: QuickAddKind;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
}[] = [
  {
    key: "expense",
    label: "Expense",
    hint: "Money out",
    icon: "arrow-up-outline",
    tone: colors.terra,
  },
  {
    key: "income",
    label: "Income",
    hint: "Money in",
    icon: "arrow-down-outline",
    tone: colors.emerald,
  },
  {
    key: "transfer",
    label: "Transfer",
    hint: "Between wallets",
    icon: "swap-horizontal-outline",
    tone: colors.primary,
  },
  {
    key: "budget",
    label: "Budget",
    hint: "Monthly limit",
    icon: "pie-chart-outline",
    tone: colors.muted,
  },
  {
    key: "account",
    label: "Wallet",
    hint: "New wallet",
    icon: "wallet-outline",
    tone: colors.muted,
  },
];

const WALLET_TYPES: WalletType[] = ["bank", "cash", "savings"];

export default function QuickAddModal({ open, onClose, initial = "expense" }: Props) {
  const qc = useQueryClient();
  const [active, setActive] = useState<QuickAddKind>(initial);
  const [error, setError] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setActive(initial);
      setError(null);
    }
  }, [open, initial]);

  const invalidateAll = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
      qc.invalidateQueries({ queryKey: ["accounts"] }),
      qc.invalidateQueries({ queryKey: ["transactions"] }),
      qc.invalidateQueries({ queryKey: ["budgets"] }),
    ]);
  };

  const txForm = useForm<TxForm>({
    defaultValues: {
      bankAccountId: "",
      toBankAccountId: "",
      amount: "",
      category: "",
      description: "",
    },
  });
  const budgetForm = useForm<BudgetFormValues>({
    defaultValues: { category: "", monthlyLimit: "" },
  });
  const accountForm = useForm<AccountFormValues>({
    defaultValues: { name: "", balance: "0", type: "bank" },
  });

  useEffect(() => {
    if (!open) return;
    const first = accountsQuery.data?.[0]?.id ?? "";
    const second = accountsQuery.data?.[1]?.id ?? first;
    txForm.setValue("bankAccountId", first);
    txForm.setValue("toBankAccountId", second);
  }, [open, accountsQuery.data]);

  const txMut = useMutation({
    mutationFn: async (v: TxForm) => {
      if (active === "transfer") {
        await transferFunds({
          fromBankAccountId: v.bankAccountId,
          toBankAccountId: v.toBankAccountId,
          amount: Number(v.amount),
          description: v.description.trim() || undefined,
          date: new Date().toISOString().slice(0, 10),
        });
        return;
      }
      await createTransaction({
        bankAccountId: v.bankAccountId,
        type: active === "income" ? "income" : "expense",
        amount: Number(v.amount),
        category: v.category.trim() || (active === "income" ? "Income" : "General"),
        description: v.description.trim() || undefined,
        date: new Date().toISOString().slice(0, 10),
      });
    },
    onSuccess: async () => {
      await invalidateAll();
      txForm.reset();
      onClose();
    },
    onError: () => setError("Couldn't save. Check fields and try again."),
  });

  const budgetMut = useMutation({
    mutationFn: (v: BudgetFormValues) => {
      const now = new Date();
      return createBudget({
        category: v.category.trim(),
        monthlyLimit: Number(v.monthlyLimit),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
    },
    onSuccess: async () => {
      await invalidateAll();
      budgetForm.reset();
      onClose();
    },
    onError: () => setError("Couldn't create budget."),
  });

  const accountMut = useMutation({
    mutationFn: (v: AccountFormValues) =>
      createAccount({ name: v.name.trim(), type: v.type, balance: Number(v.balance) || 0 }),
    onSuccess: async () => {
      await invalidateAll();
      accountForm.reset();
      onClose();
    },
    onError: () => setError("Couldn't create wallet."),
  });

  const wallets = accountsQuery.data ?? [];
  const selectedFrom = txForm.watch("bankAccountId");
  const selectedTo = txForm.watch("toBankAccountId");
  const selectedWalletType = accountForm.watch("type");
  const busy = txMut.isPending || budgetMut.isPending || accountMut.isPending;

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Quick add</Text>
          <Text style={styles.sub}>One place to log everything that moved your money.</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tiles}
          >
            {TILES.map((t) => {
              const on = active === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => {
                    setActive(t.key);
                    setError(null);
                  }}
                  style={[
                    styles.tile,
                    on && { borderColor: t.tone, backgroundColor: `${t.tone}22` },
                  ]}
                >
                  <Ionicons name={t.icon} size={18} color={on ? t.tone : colors.faint} />
                  <Text style={[styles.tileLabel, on && { color: t.tone }]}>{t.label}</Text>
                  <Text style={styles.tileHint}>{t.hint}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
            {error ? <Banner variant="error">{error}</Banner> : null}

            {(active === "expense" || active === "income" || active === "transfer") && (
              <View style={styles.form}>
                <Text style={styles.fieldLabel}>
                  {active === "transfer" ? "From wallet" : "Wallet"}
                </Text>
                <View style={styles.chipRow}>
                  {wallets.map((w) => (
                    <Pressable
                      key={w.id}
                      style={[styles.chip, selectedFrom === w.id && styles.chipOn]}
                      onPress={() => txForm.setValue("bankAccountId", w.id)}
                    >
                      <Text style={[styles.chipText, selectedFrom === w.id && styles.chipTextOn]}>
                        {w.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {active === "transfer" ? (
                  <>
                    <Text style={styles.fieldLabel}>To wallet</Text>
                    <View style={styles.chipRow}>
                      {wallets.map((w) => (
                        <Pressable
                          key={w.id}
                          style={[styles.chip, selectedTo === w.id && styles.chipOn]}
                          onPress={() => txForm.setValue("toBankAccountId", w.id)}
                        >
                          <Text style={[styles.chipText, selectedTo === w.id && styles.chipTextOn]}>
                            {w.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}

                <Controller
                  control={txForm.control}
                  name="amount"
                  rules={{ required: "Amount required" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      label="Amount"
                      placeholder="0"
                      keyboardType="decimal-pad"
                      value={field.value}
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                {active !== "transfer" ? (
                  <Controller
                    control={txForm.control}
                    name="category"
                    render={({ field }) => (
                      <TextField
                        label="Category"
                        placeholder={active === "income" ? "Salary" : "Food"}
                        value={field.value}
                        onChangeText={field.onChange}
                      />
                    )}
                  />
                ) : null}
                <Controller
                  control={txForm.control}
                  name="description"
                  render={({ field }) => (
                    <TextField
                      label="Note"
                      placeholder="Optional"
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                  )}
                />
                <Button
                  size="lg"
                  loading={busy}
                  onPress={txForm.handleSubmit((v) => {
                    setError(null);
                    if (!v.bankAccountId) {
                      setError("Select a wallet first.");
                      return;
                    }
                    if (
                      active === "transfer" &&
                      (!v.toBankAccountId || v.toBankAccountId === v.bankAccountId)
                    ) {
                      setError("Pick two different wallets for transfer.");
                      return;
                    }
                    txMut.mutate(v);
                  })}
                >
                  {active === "transfer"
                    ? "Transfer"
                    : active === "income"
                      ? "Add income"
                      : "Add expense"}
                </Button>
              </View>
            )}

            {active === "budget" && (
              <View style={styles.form}>
                <Controller
                  control={budgetForm.control}
                  name="category"
                  rules={{ required: "Category required" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      label="Category"
                      placeholder="Food"
                      value={field.value}
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={budgetForm.control}
                  name="monthlyLimit"
                  rules={{ required: "Limit required" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      label="Monthly limit"
                      placeholder="15000"
                      keyboardType="decimal-pad"
                      value={field.value}
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Button
                  size="lg"
                  loading={busy}
                  onPress={budgetForm.handleSubmit((v) => {
                    setError(null);
                    budgetMut.mutate(v);
                  })}
                >
                  Save budget
                </Button>
              </View>
            )}

            {active === "account" && (
              <View style={styles.form}>
                <Controller
                  control={accountForm.control}
                  name="name"
                  rules={{ required: "Name required" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      label="Name"
                      placeholder="HBL Current"
                      value={field.value}
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={accountForm.control}
                  name="balance"
                  render={({ field }) => (
                    <TextField
                      label="Opening balance"
                      placeholder="0"
                      keyboardType="decimal-pad"
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                  )}
                />
                <Text style={styles.fieldLabel}>Type</Text>
                <View style={styles.chipRow}>
                  {WALLET_TYPES.map((t) => (
                    <Pressable
                      key={t}
                      style={[styles.chip, selectedWalletType === t && styles.chipOn]}
                      onPress={() => accountForm.setValue("type", t)}
                    >
                      <Text
                        style={[styles.chipText, selectedWalletType === t && styles.chipTextOn]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Button
                  size="lg"
                  loading={busy}
                  onPress={accountForm.handleSubmit((v) => {
                    setError(null);
                    accountMut.mutate(v);
                  })}
                >
                  Save wallet
                </Button>
              </View>
            )}

            {wallets.length === 0 &&
            (active === "expense" || active === "income" || active === "transfer") ? (
              <Banner variant="error">Add a wallet first (Quick add → Wallet).</Banner>
            ) : null}
          </ScrollView>

          <Button variant="outline" size="md" onPress={onClose} style={styles.cancel}>
            Close
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.lg,
    maxHeight: "92%",
    gap: spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.xl,
    color: colors.ink,
  },
  sub: {
    fontFamily: typography.family.sans,
    fontSize: typography.size.sm,
    color: colors.faint,
    marginBottom: spacing.sm,
  },
  tiles: { gap: spacing.sm, paddingBottom: spacing.sm },
  tile: {
    width: 108,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: 4,
  },
  tileLabel: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.sm,
    color: colors.ink,
  },
  tileHint: {
    fontFamily: typography.family.mono,
    fontSize: 9,
    color: colors.faint,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  formScroll: { maxHeight: 380 },
  form: { gap: spacing.md, paddingBottom: spacing.md },
  fieldLabel: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    color: colors.faint,
    textTransform: "uppercase",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: "rgba(252,213,53,0.12)" },
  chipText: {
    color: colors.muted,
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.sm,
  },
  chipTextOn: { color: colors.primary },
  cancel: { marginTop: spacing.xs },
});
