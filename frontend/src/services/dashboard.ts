import axios from "@libs/axios";
import { addMonths, differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  mapApiAccountToWallet,
  mapApiTransactionToUi,
  type ApiBankAccount,
  type ApiTransaction,
} from "@/lib/finance-api-mappers";
import { shouldUseCloudFinance } from "@/lib/finance-backend-mode";
import { buildChartData, buildDashboardSummary, readState } from "@/lib/finance-store";
import type {
  BudgetStatus,
  ChartPoint,
  DashboardSubscriptionRow,
  DashboardSummary,
  Transaction,
} from "@utils/types";

export type DashboardDateRange = { from: string; to: string };

type DashboardApiPayload = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  expenseByCategory: { category: string; total: number }[];
  recentTransactions: ApiTransaction[];
};

function aggregatePeriodFromTransactions(
  txs: Transaction[],
  from: string,
  to: string
): {
  monthlyIncome: number;
  monthlyExpense: number;
  expenseByCategory: { category: string; total: number }[];
} {
  const ff = from.slice(0, 10);
  const tt = to.slice(0, 10);
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  const cat = new Map<string, number>();
  for (const t of txs) {
    const d = t.date.slice(0, 10);
    if (d < ff || d > tt) continue;
    if (t.type === "transfer") continue;
    if (t.type === "income") monthlyIncome += t.amount;
    else if (t.type === "expense") {
      monthlyExpense += t.amount;
      cat.set(t.category, (cat.get(t.category) ?? 0) + t.amount);
    }
  }
  const expenseByCategory = [...cat.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  return { monthlyIncome, monthlyExpense, expenseByCategory };
}

function upcomingSubscriptionsFromLocal(wallets: DashboardSummary["wallets"]): DashboardSubscriptionRow[] {
  const s = readState();
  const walletNames = new Map(wallets.map((w) => [w.id, w.name]));
  const today = format(new Date(), "yyyy-MM-dd");
  return s.subscriptions
    .filter((sub) => sub.status === "active")
    .map((sub) => {
      const d = parseISO(sub.nextRenewal.slice(0, 10));
      const daysUntil = differenceInCalendarDays(d, parseISO(today));
      return {
        id: sub.id,
        name: sub.name,
        amount: sub.amount,
        nextRenewal: sub.nextRenewal,
        walletName: walletNames.get(sub.walletId) ?? "Wallet",
        daysUntil,
      };
    })
    .filter((r) => r.daysUntil >= 0 && r.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

async function chartFromTransactions(range: DashboardDateRange): Promise<ChartPoint[]> {
  const { data: txJson } = await axios.get<{ transactions: ApiTransaction[] }>("/transactions", {
    params: {
      from: range.from.slice(0, 10),
      to: range.to.slice(0, 10),
      limit: 500,
    },
  });
  const txs = txJson.transactions.map(mapApiTransactionToUi);
  const points: ChartPoint[] = [];
  const fromDate = parseISO(range.from.slice(0, 10));
  const toDate = parseISO(range.to.slice(0, 10));
  let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const endMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  while (cursor <= endMonth) {
    const m = cursor.getMonth() + 1;
    const y = cursor.getFullYear();
    const start = format(cursor, "yyyy-MM-dd");
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const agg = aggregatePeriodFromTransactions(txs, start, end);
    points.push({
      label: format(cursor, "MMM yy"),
      year: y,
      month: m,
      income: agg.monthlyIncome,
      expense: agg.monthlyExpense,
    });
    cursor = addMonths(cursor, 1);
  }
  return points;
}

export const fetchDashboardSummary = async (
  range?: DashboardDateRange
): Promise<{ data: DashboardSummary }> => {
  if (!shouldUseCloudFinance()) {
    return { data: buildDashboardSummary(range) };
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [{ data: dash }, { data: budgetRes }, { data: acJson }] = await Promise.all([
    axios.get<DashboardApiPayload>("/dashboard/summary"),
    axios.get<{ status: BudgetStatus[] }>("/budgets/status", { params: { month, year } }),
    axios.get<{ accounts: ApiBankAccount[] }>("/accounts"),
  ]);

  const wallets = acJson.accounts.map((a) => mapApiAccountToWallet(a));

  let monthlyIncome = dash.monthlyIncome;
  let monthlyExpense = dash.monthlyExpense;
  let expenseByCategory = dash.expenseByCategory;
  let recentTransactions = dash.recentTransactions.map(mapApiTransactionToUi);

  if (range) {
    const { data: txJson } = await axios.get<{ transactions: ApiTransaction[] }>("/transactions", {
      params: {
        from: range.from.slice(0, 10),
        to: range.to.slice(0, 10),
        limit: 500,
      },
    });
    const txs = txJson.transactions.map(mapApiTransactionToUi);
    const agg = aggregatePeriodFromTransactions(txs, range.from, range.to);
    monthlyIncome = agg.monthlyIncome;
    monthlyExpense = agg.monthlyExpense;
    expenseByCategory = agg.expenseByCategory;
    recentTransactions = [...txs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }

  const monthlySavings = monthlyIncome - monthlyExpense;
  const savingsRate =
    monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 1000) / 10 : 0;

  const walletDistribution = wallets
    .filter((w) => w.balance > 0)
    .map((w) => ({ name: w.name, value: w.balance, color: w.color }));

  const summary: DashboardSummary = {
    totalBalance: dash.totalBalance,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    savingsRate,
    wallets,
    recentTransactions,
    expenseByCategory,
    budgetOverview: budgetRes.status,
    upcomingSubscriptions: upcomingSubscriptionsFromLocal(wallets),
    walletDistribution,
  };

  return { data: summary };
};

export const fetchDashboardChart = async (
  range?: DashboardDateRange
): Promise<{ data: { months: ChartPoint[] } }> => {
  if (!shouldUseCloudFinance()) {
    return { data: { months: buildChartData(range) } };
  }

  if (!range) {
    const { data } = await axios.get<{ months: ChartPoint[] }>("/dashboard/chart-data");
    return { data: { months: data.months } };
  }

  const months = await chartFromTransactions(range);
  return { data: { months } };
};
