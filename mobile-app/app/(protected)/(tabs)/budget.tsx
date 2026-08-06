import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { createBudget, fetchBudgetStatus } from "@/services/budgets";
import type { BudgetStatus } from "@/utils/types";
import { formatPKR } from "@/utils/currency";
import { colors, radii, spacing, typography } from "@/constants/theme";

type FormValues = { category: string; monthlyLimit: string };

export default function BudgetScreen() {
  const qc = useQueryClient();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["budgets", month, year],
    queryFn: () => fetchBudgetStatus(month, year),
  });

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { category: "", monthlyLimit: "" },
  });

  const createMut = useMutation({
    mutationFn: (v: FormValues) =>
      createBudget({
        category: v.category.trim(),
        monthlyLimit: Number(v.monthlyLimit),
        month,
        year,
      }),
    onSuccess: async () => {
      setOpen(false);
      reset();
      await qc.invalidateQueries({ queryKey: ["budgets"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const stateColor = (s: BudgetStatus["state"]) =>
    s === "over" ? colors.terra : s === "warn" ? colors.warning : colors.emerald;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.sub}>
            {now.toLocaleString("en", { month: "long" })} {year}
          </Text>
        </View>
        <Button size="md" onPress={() => setOpen(true)}>
          Add
        </Button>
      </View>

      {query.isError ? <Banner variant="error">Couldn&apos;t load budgets.</Banner> : null}

      {query.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No budgets this month.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.name}>{item.category}</Text>
                <Text style={[styles.state, { color: stateColor(item.state) }]}>{item.state}</Text>
              </View>
              <Text style={styles.meta}>
                {formatPKR(item.spent)} of {formatPKR(item.limit)} · {item.pct}%
              </Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.min(item.pct, 100)}%`, backgroundColor: stateColor(item.state) },
                  ]}
                />
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New budget</Text>
            <Controller
              control={control}
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
              control={control}
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
            {createMut.isError ? <Banner variant="error">Couldn&apos;t create budget.</Banner> : null}
            <View style={styles.modalActions}>
              <Button variant="outline" size="md" onPress={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="md" loading={createMut.isPending} onPress={handleSubmit((v) => createMut.mutate(v))}>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontFamily: typography.family.sansBold, fontSize: typography.size.xxl, color: colors.ink },
  sub: { fontFamily: typography.family.sans, fontSize: typography.size.sm, color: colors.faint },
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  head: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontFamily: typography.family.sansSemiBold, color: colors.ink, fontSize: typography.size.base },
  state: { fontFamily: typography.family.mono, fontSize: typography.size.xs, textTransform: "uppercase" },
  meta: { fontFamily: typography.family.sans, color: colors.muted, fontSize: typography.size.sm },
  track: { height: 6, backgroundColor: colors.surface2, borderRadius: radii.pill, overflow: "hidden" },
  fill: { height: 6, borderRadius: radii.pill },
  empty: { textAlign: "center", color: colors.faint, marginTop: spacing.xl },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: { fontFamily: typography.family.sansBold, fontSize: typography.size.xl, color: colors.ink },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
});
