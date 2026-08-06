import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import QuickAddModal from "@/components/QuickAddModal";
import { fetchTransactions } from "@/services/transactions";
import type { Transaction } from "@/utils/types";
import { formatPKR } from "@/utils/currency";
import { colors, radii, spacing, typography } from "@/constants/theme";

export default function ExpensesScreen() {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["transactions", "expense"],
    queryFn: () => fetchTransactions({ type: "expense", limit: 80 }),
  });

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.sub}>All expense entries. Add new ones here or from Home / More.</Text>
        <Button size="md" onPress={() => setOpen(true)}>
          Add expense
        </Button>
      </View>

      {query.isError ? <Banner variant="error">Couldn&apos;t load expenses.</Banner> : null}

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
          ListEmptyComponent={<Text style={styles.empty}>No expenses yet.</Text>}
          renderItem={({ item }: { item: Transaction }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cat}>{item.category}</Text>
                <Text style={styles.meta}>
                  {item.wallet?.name ?? "—"} · {item.date}
                </Text>
              </View>
              <Text style={styles.amt}>−{formatPKR(item.amount, { showSymbol: false })}</Text>
            </View>
          )}
        />
      )}

      <QuickAddModal open={open} initial="expense" onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  sub: { fontFamily: typography.family.sans, fontSize: typography.size.sm, color: colors.faint },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cat: { fontFamily: typography.family.sansSemiBold, color: colors.ink, fontSize: typography.size.sm },
  meta: { fontFamily: typography.family.sans, color: colors.faint, fontSize: typography.size.xs, marginTop: 2 },
  amt: { fontFamily: typography.family.sansBold, fontSize: typography.size.sm, color: colors.terra },
  empty: { textAlign: "center", color: colors.faint, marginTop: spacing.xl },
});
