/** Shared domain types aligned with the web app (frontend/src/utils/types.d.ts). */

export type Role = "user" | "admin";
export type WalletType = "bank" | "cash" | "credit" | "savings";
export type TransactionType = "income" | "expense" | "transfer";
export type GoalStatus = "active" | "completed" | "paused";

export type User = {
  id: string;
  name: string;
  email: string;
  currency: string;
  role: Role;
  createdAt: string;
};

export type Wallet = {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  openingBalance: number;
  currency: string;
  color: string;
  icon: string;
  createdAt: string;
  hasPin?: boolean;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  tags?: string[];
  wallet?: Pick<Wallet, "id" | "name" | "color" | "icon">;
  transferGroupId?: string;
  transferDirection?: "out" | "in";
};

export type BudgetStatus = {
  id: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  pct: number;
  state: "ok" | "warn" | "over";
};

export type ExpenseByCategoryPoint = {
  category: string;
  total: number;
};

export type ChartPoint = {
  label: string;
  year: number;
  month: number;
  income: number;
  expense: number;
};

export type GoalContributionRecord = {
  id: string;
  amount: number | string;
  date: string;
  note: string | null;
};

export type Goal = {
  id: string;
  title: string;
  targetAmount: number | string;
  savedAmount: number | string;
  deadline: string | null;
  icon: string;
  status: GoalStatus;
  contributions?: GoalContributionRecord[];
};

export type DashboardSummary = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  savingsRate: number;
  wallets: Wallet[];
  recentTransactions: Transaction[];
  expenseByCategory: ExpenseByCategoryPoint[];
  budgetOverview: BudgetStatus[];
  topGoals: {
    id: string;
    title: string;
    icon: string;
    target: number;
    saved: number;
    pct: number;
    deadline: string | null;
  }[];
};
