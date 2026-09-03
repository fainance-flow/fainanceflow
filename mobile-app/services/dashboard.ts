import axios from "@/lib/axios";
import {
  mapApiAccountToWallet,
  mapApiTransactionToUi,
  type ApiBankAccount,
  type ApiTransaction,
} from "@/lib/finance-api-mappers";
import { parseMoney } from "@/utils/currency";
import type {
  BudgetStatus,
  ChartPoint,
  DashboardSummary,
  ExpenseByCategoryPoint,
} from "@/utils/types";

type DashboardApiPayload = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings?: number;
  savingsRate?: number;
  accounts?: ApiBankAccount[];
  recentTransactions: ApiTransaction[];
  expenseByCategory: ExpenseByCategoryPoint[];
  topGoals?: DashboardSummary["topGoals"];
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date();
  const [summaryRes, budgetsRes] = await Promise.all([
    axios.get<DashboardApiPayload>("/dashboard/summary"),
    axios
      .get<{ status: BudgetStatus[] }>("/budgets/status", {
        params: { month: now.getMonth() + 1, year: now.getFullYear() },
      })
      .catch(() => ({ data: { status: [] as BudgetStatus[] } })),
  ]);

  const raw = summaryRes.data;
  const income = parseMoney(raw.monthlyIncome);
  const expense = parseMoney(raw.monthlyExpense);
  const savings = raw.monthlySavings ?? income - expense;
  const savingsRate =
    raw.savingsRate ?? (income > 0 ? Math.round((savings / income) * 1000) / 10 : 0);
  const wallets = (raw.accounts ?? []).map((a) => mapApiAccountToWallet(a));

  const budgets = (budgetsRes.data.status ?? []).map((s) => ({
    ...s,
    limit: parseMoney(s.limit),
    spent: parseMoney(s.spent),
    remaining: parseMoney(s.remaining),
    pct: parseMoney(s.pct),
  }));

  return {
    totalBalance: parseMoney(raw.totalBalance),
    monthlyIncome: income,
    monthlyExpense: expense,
    monthlySavings: parseMoney(savings),
    savingsRate: parseMoney(savingsRate),
    wallets,
    recentTransactions: (raw.recentTransactions ?? []).map(mapApiTransactionToUi),
    expenseByCategory: (raw.expenseByCategory ?? []).map((c) => ({
      category: c.category,
      total: parseMoney(c.total),
    })),
    budgetOverview: budgets,
    topGoals: (raw.topGoals ?? []).map((g) => ({
      ...g,
      target: parseMoney(g.target),
      saved: parseMoney(g.saved),
      pct: parseMoney(g.pct),
    })),
  };
}

export async function fetchChartData(): Promise<ChartPoint[]> {
  const { data } = await axios.get<{ months: ChartPoint[] }>("/dashboard/chart-data");
  return (data.months ?? []).map((m) => ({
    ...m,
    income: parseMoney(m.income),
    expense: parseMoney(m.expense),
  }));
}
