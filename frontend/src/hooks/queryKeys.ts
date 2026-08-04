import type { TransactionFilters } from "@services/transactions";

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  accounts: {
    all: ["accounts"] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (filters?: TransactionFilters) => ["transactions", "list", filters ?? {}] as const,
  },
  budgets: {
    list: (month: number, year: number) => ["budgets", "list", month, year] as const,
    status: (month: number, year: number) => ["budgets", "status", month, year] as const,
  },
  goals: {
    all: ["goals"] as const,
  },
  subscriptions: {
    all: ["subscriptions"] as const,
  },
  loans: {
    all: ["loans"] as const,
  },
  dashboard: {
    summary: ["dashboard", "summary"] as const,
    chart: ["dashboard", "chart"] as const,
  },
} as const;
