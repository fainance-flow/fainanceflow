import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import Logo from "@/components/ui/Logo";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import IncomeExpenseBars from "@/components/charts/IncomeExpenseBars";
import QuickAddModal, { type QuickAddKind } from "@/components/QuickAddModal";
import { fetchChartData, fetchDashboardSummary } from "@/services/dashboard";
import { useAppSelector } from "@/hooks/useTypedRedux";
import { formatPKR } from "@/utils/currency";
import { colors, radii, spacing, typography } from "@/constants/theme";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.name?.split(" ")[0];
  const hello = greeting(new Date().getHours());
  const [quick, setQuick] = useState<{ open: boolean; kind: QuickAddKind }>({
    open: false,
    kind: "expense",
  });

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardSummary,
  });
  const chartQuery = useQuery({
    queryKey: ["dashboard", "chart"],
    queryFn: fetchChartData,
  });

  useFocusEffect(
    useCallback(() => {
      void summaryQuery.refetch();
      void chartQuery.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on focus only
    }, [])
  );

  const refreshing = summaryQuery.isRefetching || chartQuery.isRefetching;
  const onRefresh = () => {
    summaryQuery.refetch();
    chartQuery.refetch();
  };

  const data = summaryQuery.data;
  const openQuick = (kind: QuickAddKind = "expense") => setQuick({ open: true, kind });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>
              {hello}
              {firstName ? `, ${firstName}` : ""}
            </Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <Logo size={32} />
        </View>

        <View style={styles.quickRow}>
          <Button size="md" onPress={() => openQuick("expense")} style={{ flex: 1 }}>
            + Expense
          </Button>
          <Button
            size="md"
            variant="outline"
            onPress={() => openQuick("income")}
            style={{ flex: 1 }}
          >
            + Income
          </Button>
          <Pressable style={styles.moreBtn} onPress={() => openQuick("transfer")} hitSlop={8}>
            <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {summaryQuery.isError ? (
          <Banner variant="error">Couldn&apos;t load dashboard. Pull to retry.</Banner>
        ) : null}

        {summaryQuery.isLoading && !data ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {!summaryQuery.isLoading && !summaryQuery.isError && data && data.wallets.length === 0 ? (
          <Banner variant="error">
            No wallets yet. Tap + Expense and create a Wallet first — or open More.
          </Banner>
        ) : null}

        {data ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Total balance · all wallets</Text>
              <Text style={styles.heroAmount}>{formatPKR(data.totalBalance)}</Text>
              {data.wallets.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pills}
                >
                  {data.wallets.map((w) => (
                    <View key={w.id} style={styles.pill}>
                      <View style={[styles.pillDot, { backgroundColor: w.color }]} />
                      <Text style={styles.pillText}>
                        {w.name} · {formatPKR(w.balance, { showSymbol: false })}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.empty}>Add a wallet to start tracking.</Text>
              )}
            </View>

            <View style={styles.stats}>
              <StatCard
                label="Income"
                value={formatPKR(data.monthlyIncome)}
                tone="emerald"
                hint="This month"
              />
              <StatCard
                label="Expense"
                value={formatPKR(data.monthlyExpense)}
                tone="terra"
                hint="This month"
              />
              <StatCard
                label="Net"
                value={formatPKR(data.monthlySavings, { signed: true })}
                tone={data.monthlySavings >= 0 ? "primary" : "terra"}
                hint={`${data.savingsRate}% saved`}
              />
            </View>

            <Text style={styles.section}>Income vs expense</Text>
            {chartQuery.isError ? (
              <Banner variant="error">Chart unavailable.</Banner>
            ) : chartQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : (
              <IncomeExpenseBars data={chartQuery.data ?? []} />
            )}

            {data.expenseByCategory.length > 0 ? (
              <>
                <Text style={styles.section}>Top categories</Text>
                <View style={styles.catList}>
                  {data.expenseByCategory.slice(0, 5).map((c) => (
                    <View key={c.category} style={styles.catRow}>
                      <Text style={styles.catName}>{c.category}</Text>
                      <Text style={styles.catAmt}>{formatPKR(c.total)}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.sectionRow}>
              <Text style={styles.section}>Recent</Text>
              <Link href="/transactions" asChild>
                <Pressable hitSlop={8}>
                  <Text style={styles.link}>See all</Text>
                </Pressable>
              </Link>
            </View>
            <View style={styles.txList}>
              {data.recentTransactions.length === 0 ? (
                <Text style={styles.empty}>
                  No transactions yet — add an expense or income above.
                </Text>
              ) : (
                data.recentTransactions.map((t) => (
                  <View key={t.id} style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txCat}>{t.category}</Text>
                      <Text style={styles.txMeta}>
                        {t.wallet?.name ?? "—"} · {t.date}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmt,
                        {
                          color:
                            t.type === "income"
                              ? colors.emerald
                              : t.type === "expense"
                                ? colors.terra
                                : colors.ink,
                        },
                      ]}
                    >
                      {t.type === "income" ? "+" : t.type === "expense" ? "−" : ""}
                      {formatPKR(t.amount, { showSymbol: false })}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {data.budgetOverview.length > 0 ? (
              <>
                <Text style={styles.section}>Budgets</Text>
                {data.budgetOverview.slice(0, 4).map((b) => (
                  <View key={b.id} style={styles.budgetCard}>
                    <View style={styles.budgetHead}>
                      <Text style={styles.catName}>{b.category}</Text>
                      <Text style={styles.catAmt}>
                        {formatPKR(b.spent)} / {formatPKR(b.limit)}
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.min(b.pct, 100)}%` as `${number}%`,
                            backgroundColor:
                              b.state === "over"
                                ? colors.terra
                                : b.state === "warn"
                                  ? colors.warning
                                  : colors.emerald,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            <Link href="/more" asChild>
              <Pressable style={styles.viewMore}>
                <Text style={styles.viewMoreText}>View more</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            </Link>
          </>
        ) : null}
      </ScrollView>

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
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.faint,
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.xxl,
    marginTop: spacing.xs,
  },
  quickRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  loading: { paddingVertical: spacing.xl, alignItems: "center" },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroLabel: {
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    color: colors.faint,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroAmount: {
    fontFamily: typography.family.sansBold,
    fontSize: typography.size.xxxl,
    color: colors.ink,
  },
  pills: { gap: spacing.sm, paddingTop: spacing.xs },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface2,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pillText: {
    fontFamily: typography.family.sans,
    fontSize: typography.size.xs,
    color: colors.muted,
  },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  section: {
    marginTop: spacing.sm,
    color: colors.faint,
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  link: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.sm,
    color: colors.primary,
  },
  catList: { gap: spacing.sm },
  catRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  catName: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.sm,
    color: colors.ink,
  },
  catAmt: { fontFamily: typography.family.sans, fontSize: typography.size.sm, color: colors.muted },
  txList: { gap: spacing.sm },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.md,
  },
  txCat: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.sm,
    color: colors.ink,
  },
  txMeta: {
    fontFamily: typography.family.sans,
    fontSize: typography.size.xs,
    color: colors.faint,
    marginTop: 2,
  },
  txAmt: { fontFamily: typography.family.sansBold, fontSize: typography.size.sm },
  empty: { color: colors.faint, fontFamily: typography.family.sans, fontSize: typography.size.sm },
  budgetCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.sm,
  },
  budgetHead: { flexDirection: "row", justifyContent: "space-between" },
  barTrack: {
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  barFill: { height: 6, borderRadius: radii.pill },
  viewMore: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  viewMoreText: {
    fontFamily: typography.family.sansSemiBold,
    fontSize: typography.size.sm,
    color: colors.primary,
  },
});
