import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import QuickAddModal, { type QuickAddKind } from "@/components/QuickAddModal";
import { fetchTransactions } from "@/services/transactions";
import type { Transaction, TransactionType } from "@/utils/types";
import { formatPKR } from "@/utils/currency";
import { colors, radii, spacing, typography } from "@/constants/theme";

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [quick, setQuick] = useState<{ open: boolean; kind: QuickAddKind }>({
    open: false,
    kind: "expense",
  });

  const txQuery = useQuery({
    queryKey: ["transactions", filter],
    queryFn: () =>
      fetchTransactions({
        limit: 80,
        type: filter === "all" ? undefined : filter,
      }),
  });

  const tone = (t: TransactionType) =>
    t === "income" ? colors.emerald : t === "expense" ? colors.terra : colors.ink;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Button size="md" onPress={() => setQuick({ open: true, kind: "expense" })}>
          Add
        </Button>
      </View>

      <View style={styles.filters}>
        {(["all", "income", "expense"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {txQuery.isError ? <Banner variant="error">Couldn&apos;t load transactions.</Banner> : null}

      {txQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={txQuery.data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={txQuery.isRefetching}
              onRefresh={() => txQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No transactions yet. Tap Add to log income or expense.</Text>
          }
          renderItem={({ item }: { item: Transaction }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cat}>{item.category}</Text>
                <Text style={styles.meta}>
                  {item.wallet?.name ?? "—"} · {item.date} · {item.type}
                </Text>
              </View>
              <Text style={[styles.amt, { color: tone(item.type) }]}>
                {item.type === "income" ? "+" : item.type === "expense" ? "−" : ""}
                {formatPKR(item.amount, { showSymbol: false })}
              </Text>
            </View>
          )}
        />
      )}

      <QuickAddModal
        open={quick.open}
        initial={quick.kind}
        onClose={() => setQuick((p) => ({ ...p, open: false }))}
      />
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
  title: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.xxl,
    color: colors.ink,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterActive: { borderColor: colors.primary, backgroundColor: "rgba(252,213,53,0.12)" },
  filterText: {
    color: colors.muted,
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.xs,
    textTransform: "capitalize",
  },
  filterTextActive: { color: colors.primary },
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
  cat: {
    fontFamily: typography.family.sansSemiBold,
    color: colors.ink,
    fontSize: typography.size.sm,
  },
  meta: {
    fontFamily: typography.family.sans,
    color: colors.faint,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  amt: { fontFamily: typography.family.sansBold, fontSize: typography.size.sm },
  empty: {
    textAlign: "center",
    color: colors.faint,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
