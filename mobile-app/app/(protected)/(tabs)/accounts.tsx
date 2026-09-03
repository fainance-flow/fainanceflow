import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import { createAccount, deleteAccount, fetchAccounts } from "@/services/accounts";
import type { Wallet, WalletType } from "@/utils/types";
import { formatPKR } from "@/utils/currency";
import { colors, radii, spacing, typography } from "@/constants/theme";

type FormValues = { name: string; balance: string; type: WalletType };

const TYPES: WalletType[] = ["bank", "cash", "savings"];

export default function AccountsScreen() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ["accounts"], queryFn: fetchAccounts });

  const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: { name: "", balance: "0", type: "bank" },
  });
  const selectedType = watch("type");

  const createMut = useMutation({
    mutationFn: (v: FormValues) =>
      createAccount({ name: v.name, type: v.type, balance: Number(v.balance) || 0 }),
    onSuccess: async () => {
      setOpen(false);
      reset();
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["accounts"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const confirmDelete = (w: Wallet) => {
    Alert.alert("Delete wallet", `Remove ${w.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(w.id) },
    ]);
  };

  const renderItem = useCallback(
    ({ item }: { item: Wallet }) => (
      <Pressable style={styles.card} onLongPress={() => confirmDelete(item)}>
        <View style={[styles.dot, { backgroundColor: item.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.type}</Text>
        </View>
        <Text style={styles.balance}>{formatPKR(item.balance)}</Text>
      </Pressable>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Wallets</Text>
          <Text style={styles.sub}>
            {query.data?.length ?? 0} wallet{(query.data?.length ?? 0) === 1 ? "" : "s"}
          </Text>
        </View>
        <Button size="md" onPress={() => setOpen(true)}>
          Add
        </Button>
      </View>

      {query.isError ? <Banner variant="error">Couldn&apos;t load wallets.</Banner> : null}

      {query.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No wallets yet — add your first one.</Text>
          }
        />
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New wallet</Text>
            <Controller
              control={control}
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
              control={control}
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
            <Text style={styles.typeLabel}>Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.typeChip, selectedType === t && styles.typeChipActive]}
                  onPress={() => setValue("type", t)}
                >
                  <Text style={[styles.typeText, selectedType === t && styles.typeTextActive]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
            {createMut.isError ? (
              <Banner variant="error">Couldn&apos;t create wallet.</Banner>
            ) : null}
            <View style={styles.modalActions}>
              <Button variant="outline" size="md" onPress={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="md"
                loading={createMut.isPending}
                onPress={handleSubmit((v) => createMut.mutate(v))}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.xxl,
    color: colors.ink,
  },
  sub: {
    fontFamily: typography.family.sans,
    fontSize: typography.size.sm,
    color: colors.faint,
    marginTop: 2,
  },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.base,
    color: colors.ink,
  },
  meta: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    color: colors.faint,
    textTransform: "uppercase",
  },
  balance: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.sm,
    color: colors.ink,
  },
  empty: {
    textAlign: "center",
    color: colors.faint,
    marginTop: spacing.xl,
    fontFamily: typography.family.sans,
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.xl,
    color: colors.ink,
  },
  typeLabel: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    color: colors.faint,
    textTransform: "uppercase",
  },
  typeRow: { flexDirection: "row", gap: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: "rgba(252,213,53,0.12)" },
  typeText: {
    color: colors.muted,
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.sm,
  },
  typeTextActive: { color: colors.primary },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
