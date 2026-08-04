import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary, fetchDashboardChart } from "@services/dashboard";
import type { DashboardDateRange } from "@services/dashboard";
import { queryKeys } from "@hooks/queryKeys";

export const useDashboardSummary = (range?: DashboardDateRange) =>
  useQuery({
    queryKey: [...queryKeys.dashboard.summary, range ?? null] as const,
    queryFn: async () => (await fetchDashboardSummary(range)).data,
  });

export const useDashboardChart = (range?: DashboardDateRange) =>
  useQuery({
    queryKey: [...queryKeys.dashboard.chart, range ?? null] as const,
    queryFn: async () => (await fetchDashboardChart(range)).data.months,
  });
