export type WalletType = "bank" | "cash" | "credit" | "savings";
export type TransactionType = "income" | "expense" | "transfer";
export type SubscriptionBillingCycle = "monthly" | "yearly" | "weekly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";
export type LoanDirection = "given" | "taken";
export type Role = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  currency: string;
  role: Role;
  createdAt: string;
};

/** Wallet with live balance (computed from opening + ledger). */
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
  /** PIN is set if the wallet is protected. Never expose raw PIN outside engine. */
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

export type Budget = {
  id: string;
  category: string;
  monthlyLimit: number | string;
  month: number;
  year: number;
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

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  billingCycle: SubscriptionBillingCycle;
  nextRenewal: string;
  category: string;
  walletId: string;
  status: SubscriptionStatus;
  createdAt: string;
};

export type Loan = {
  id: string;
  name: string;
  principalAmount: number;
  remainingBalance: number;
  interestRate: number;
  emiAmount: number;
  nextDueDate: string;
  lenderName: string;
  type: LoanDirection;
  createdAt: string;
};

export type ExpenseByCategoryPoint = {
  category: string;
  total: number;
};

export type DashboardSubscriptionRow = {
  id: string;
  name: string;
  amount: number;
  nextRenewal: string;
  walletName: string;
  daysUntil: number;
};

export type WalletDistributionPoint = {
  name: string;
  value: number;
  color: string;
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
  upcomingSubscriptions: DashboardSubscriptionRow[];
  walletDistribution: WalletDistributionPoint[];
};

export type ChartPoint = {
  label: string;
  year: number;
  month: number;
  income: number;
  expense: number;
};

/** Legacy goals type — goals UI removed in local-first mode. */
export type GoalStatus = "active" | "completed" | "paused";
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
