import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Banner from "@/components/ui/Banner";
import StatCard from "@/components/ui/StatCard";
import IncomeExpenseBars from "@/components/charts/IncomeExpenseBars";
import { fetchChartData, fetchDashboardSummary } from "@/services/dashboard";
import { formatPKR } from "@/utils/currency";
import { colors, radii, spacing, typography } from "@/constants/theme";

export default function ReportsScreen() {
  const summaryQuery = useQuery({ queryKey: ["dashboard", "summary"], queryFn: fetchDashboardSummary });
  const chartQuery = useQuery({ queryKey: ["dashboard", "chart"], queryFn: fetchChartData });

  const data = summaryQuery.data;
  const refreshing = summaryQuery.isRefetching || chartQuery.isRefetching;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              summaryQuery.refetch();
              chartQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.sub}>Monthly income, expense, and category breakdown.</Text>

        {summaryQuery.isError ? <Banner variant="error">Couldn&apos;t load reports.</Banner> : null}

        {summaryQuery.isLoading && !data ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : null}

        {data ? (
          <>
            <View style={styles.stats}>
              <StatCard label="Income" value={formatPKR(data.monthlyIncome)} tone="emerald" />
              <StatCard label="Expense" value={formatPKR(data.monthlyExpense)} tone="terra" />
              <StatCard
                label="Savings rate"
                value={`${data.savingsRate}%`}
                tone="primary"
                hint={formatPKR(data.monthlySavings)}
              />
            </View>

            <Text style={styles.section}>6-month trend</Text>
            {chartQuery.isError ? (
              <Banner variant="error">Chart unavailable. Pull to retry.</Banner>
            ) : chartQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <IncomeExpenseBars data={chartQuery.data ?? []} />
            )}

            <Text style={styles.section}>Categories this month</Text>
            <View style={styles.list}>
              {(data.expenseByCategory ?? []).length === 0 ? (
                <Text style={styles.empty}>No expense categories yet. Add expenses from Home or More → Quick add.</Text>
              ) : (
                data.expenseByCategory.map((c) => (
                  <View key={c.category} style={styles.row}>
                    <Text style={styles.name}>{c.category}</Text>
                    <Text style={styles.amt}>{formatPKR(c.total)}</Text>
                  </View>
                ))
              )}
            </View>

            {data.wallets.length === 0 ? (
              <Text style={styles.empty}>No wallets yet — create one from More → Wallet.</Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontFamily: typography.family.sansBold, fontSize: typography.size.xxl, color: colors.ink },
  sub: { fontFamily: typography.family.sans, fontSize: typography.size.sm, color: colors.faint },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  section: {
    marginTop: spacing.sm,
    color: colors.faint,
    fontFamily: typography.family.mono,
    fontSize: typography.size.xs,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  name: { fontFamily: typography.family.sansSemiBold, color: colors.ink, fontSize: typography.size.sm },
  amt: { fontFamily: typography.family.sans, color: colors.muted, fontSize: typography.size.sm },
  empty: { color: colors.faint, fontFamily: typography.family.sans },
});
