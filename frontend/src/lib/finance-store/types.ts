import type {
  WalletType,
  TransactionType,
  SubscriptionBillingCycle,
  SubscriptionStatus,
  LoanDirection,
} from "@utils/types";

export type WalletStored = {
  id: string;
  name: string;
  type: WalletType;
  openingBalance: number;
  currency: string;
  color: string;
  icon: string;
  createdAt: string;
  /** Optional PIN — stored as plain text for local-first mode. */
  pin?: string;
};

export type TransferDirection = "out" | "in";

export type TransactionStored = {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  tags: string[];
  createdAt: string;
  transferGroupId?: string;
  transferDirection?: TransferDirection;
  subscriptionId?: string;
  loanId?: string;
  historical?: boolean;
};

export type BudgetStored = {
  id: string;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
};

export type SubscriptionStored = {
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

export type LoanStored = {
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

export type FinanceState = {
  version: 1;
  wallets: WalletStored[];
  transactions: TransactionStored[];
  budgets: BudgetStored[];
  subscriptions: SubscriptionStored[];
  loans: LoanStored[];
};
