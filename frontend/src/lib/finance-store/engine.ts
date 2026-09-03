import {
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  parseISO,
  subMonths,
} from "date-fns";
import { FINANCE_STORAGE_KEY } from "./constants";
import type {
  BudgetStored,
  FinanceState,
  LoanStored,
  SubscriptionStored,
  TransactionStored,
  WalletStored,
} from "./types";
import type {
  BudgetStatus,
  ChartPoint,
  DashboardSubscriptionRow,
  DashboardSummary,
  Transaction,
  Wallet,
  WalletDistributionPoint,
} from "@utils/types";

const EMPTY: FinanceState = {
  version: 1,
  wallets: [],
  transactions: [],
  budgets: [],
  subscriptions: [],
  loans: [],
};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export function readState(): FinanceState {
  if (typeof window === "undefined") return clone(EMPTY);
  try {
    const raw = localStorage.getItem(FINANCE_STORAGE_KEY);
    if (!raw) return clone(EMPTY);
    const parsed = JSON.parse(raw) as Partial<FinanceState>;
    if (!parsed || parsed.version !== 1) return clone(EMPTY);
    return {
      version: 1,
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
      loans: Array.isArray(parsed.loans) ? parsed.loans : [],
    };
  } catch {
    return clone(EMPTY);
  }
}

export function writeState(next: FinanceState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(next));
}

export function mutate(fn: (draft: FinanceState) => void): void {
  const s = readState();
  fn(s);
  writeState(s);
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ff_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function calendarKey(iso: string): string {
  return iso.slice(0, 10);
}

function inMonth(iso: string, month: number, year: number): boolean {
  const key = calendarKey(iso);
  const [y, m] = key.split("-").map(Number);
  return y === year && m === month;
}

function inRange(iso: string, from: string, to: string): boolean {
  const key = calendarKey(iso);
  return key >= calendarKey(from) && key <= calendarKey(to);
}

function sumIncomeExpenseRange(
  s: FinanceState,
  from: string,
  to: string
): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const t of s.transactions) {
    if (!inRange(t.date, from, to)) continue;
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
  }
  return { income, expense };
}

export function computeBalances(s: FinanceState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of s.wallets) {
    out[w.id] = w.openingBalance;
  }
  for (const t of s.transactions) {
    if (t.historical) continue;
    const amt = Number(t.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    if (t.type === "income") {
      out[t.walletId] = (out[t.walletId] ?? 0) + amt;
    } else if (t.type === "expense") {
      out[t.walletId] = (out[t.walletId] ?? 0) - amt;
    } else if (t.type === "transfer") {
      if (t.transferDirection === "out") {
        out[t.walletId] = (out[t.walletId] ?? 0) - amt;
      } else if (t.transferDirection === "in") {
        out[t.walletId] = (out[t.walletId] ?? 0) + amt;
      }
    }
  }
  return out;
}

function toWallet(w: WalletStored, balance: number): Wallet {
  return {
    id: w.id,
    name: w.name,
    type: w.type,
    balance,
    openingBalance: w.openingBalance,
    currency: w.currency,
    color: w.color,
    icon: w.icon,
    createdAt: w.createdAt,
    hasPin: Boolean(w.pin),
  };
}

/** Set or clear a wallet PIN. Pass empty string to remove. */
export function setWalletPin(walletId: string, pin: string): void {
  mutate((draft) => {
    const w = draft.wallets.find((x) => x.id === walletId);
    if (!w) return;
    w.pin = pin.trim() || undefined;
  });
}

/** Returns true if the supplied PIN matches the stored one. */
export function verifyWalletPin(walletId: string, pin: string): boolean {
  const s = readState();
  const w = s.wallets.find((x) => x.id === walletId);
  if (!w || !w.pin) return true; // no PIN set = open
  return w.pin === pin.trim();
}

export function listWallets(): Wallet[] {
  const s = readState();
  const bal = computeBalances(s);
  return s.wallets.map((w) => toWallet(w, bal[w.id] ?? w.openingBalance));
}

export function getWalletById(id: string): Wallet | undefined {
  return listWallets().find((w) => w.id === id);
}

export type TransactionListFilters = {
  from?: string;
  to?: string;
  category?: string;
  walletId?: string;
  accountId?: string;
  type?: Transaction["type"];
  q?: string;
  limit?: number;
  minAmount?: number;
  maxAmount?: number;
};

function enrichTransaction(
  t: TransactionStored,
  walletMap: Map<string, WalletStored>
): Transaction {
  const w = walletMap.get(t.walletId);
  return {
    id: t.id,
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: t.date,
    tags: t.tags,
    transferGroupId: t.transferGroupId,
    transferDirection: t.transferDirection,
    wallet: w ? { id: w.id, name: w.name, color: w.color, icon: w.icon } : undefined,
  };
}

export function listTransactions(filters?: TransactionListFilters): Transaction[] {
  const s = readState();
  const walletMap = new Map(s.wallets.map((w) => [w.id, w]));
  let rows = [...s.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const wid = filters?.walletId ?? filters?.accountId;
  if (wid) rows = rows.filter((t) => t.walletId === wid);
  if (filters?.type) rows = rows.filter((t) => t.type === filters.type);
  if (filters?.category) rows = rows.filter((t) => t.category === filters.category);
  if (filters?.from) {
    const f = calendarKey(filters.from);
    rows = rows.filter((t) => calendarKey(t.date) >= f);
  }
  if (filters?.to) {
    const f = calendarKey(filters.to);
    rows = rows.filter((t) => calendarKey(t.date) <= f);
  }
  if (filters?.minAmount !== undefined) {
    rows = rows.filter((t) => t.amount >= filters.minAmount!);
  }
  if (filters?.maxAmount !== undefined) {
    rows = rows.filter((t) => t.amount <= filters.maxAmount!);
  }
  if (filters?.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    rows = rows.filter((t) =>
      `${t.description ?? ""} ${t.category} ${(t.tags ?? []).join(" ")}`.toLowerCase().includes(q)
    );
  }
  if (filters?.limit) rows = rows.slice(0, filters.limit);

  return rows.map((t) => enrichTransaction(t, walletMap));
}

function sumIncomeExpense(
  s: FinanceState,
  month: number,
  year: number
): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const t of s.transactions) {
    if (!inMonth(t.date, month, year)) continue;
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
  }
  return { income, expense };
}

function spentForCategoryMonth(
  s: FinanceState,
  category: string,
  month: number,
  year: number
): number {
  let spent = 0;
  for (const t of s.transactions) {
    if (t.type !== "expense") continue;
    if (t.category !== category) continue;
    if (!inMonth(t.date, month, year)) continue;
    spent += t.amount;
  }
  return spent;
}

export function buildBudgetStatus(month: number, year: number): BudgetStatus[] {
  const s = readState();
  return s.budgets
    .filter((b) => b.month === month && b.year === year)
    .map((b) => {
      const limit = Number(b.monthlyLimit);
      const spent = spentForCategoryMonth(s, b.category, month, year);
      const remaining = limit - spent;
      const pct = limit > 0 ? Math.round((spent / limit) * 1000) / 10 : 0;
      let state: BudgetStatus["state"] = "ok";
      if (spent > limit) state = "over";
      else if (pct >= 80) state = "warn";
      return {
        id: b.id,
        category: b.category,
        limit,
        spent,
        remaining,
        pct,
        state,
      };
    });
}

export function listBudgetsRaw(month: number, year: number): BudgetStored[] {
  return readState().budgets.filter((b) => b.month === month && b.year === year);
}

export function listSubscriptions(): SubscriptionStored[] {
  return [...readState().subscriptions].sort(
    (a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime()
  );
}

export function listLoans(): LoanStored[] {
  return [...readState().loans];
}

export function buildDashboardSummary(range?: { from: string; to: string }): DashboardSummary {
  const s = readState();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const bal = computeBalances(s);
  const wallets = s.wallets.map((w) => toWallet(w, bal[w.id] ?? w.openingBalance));
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const { income: monthlyIncome, expense: monthlyExpense } = range
    ? sumIncomeExpenseRange(s, range.from, range.to)
    : sumIncomeExpense(s, month, year);
  const monthlySavings = monthlyIncome - monthlyExpense;
  const savingsRate =
    monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 1000) / 10 : 0;

  const expenseByCategoryMap = new Map<string, number>();
  for (const t of s.transactions) {
    if (t.type !== "expense") continue;
    const inPeriod = range ? inRange(t.date, range.from, range.to) : inMonth(t.date, month, year);
    if (!inPeriod) continue;
    expenseByCategoryMap.set(t.category, (expenseByCategoryMap.get(t.category) ?? 0) + t.amount);
  }
  const expenseByCategory = [...expenseByCategoryMap.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const walletMap = new Map(s.wallets.map((w) => [w.id, w]));
  let txSource = [...s.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  if (range) txSource = txSource.filter((t) => inRange(t.date, range.from, range.to));
  const recentTransactions = txSource.slice(0, 5).map((t) => enrichTransaction(t, walletMap));

  const budgetOverview = buildBudgetStatus(month, year);

  const today = format(now, "yyyy-MM-dd");
  const upcomingSubscriptions: DashboardSubscriptionRow[] = s.subscriptions
    .filter((sub) => sub.status === "active")
    .map((sub) => {
      const d = parseISO(sub.nextRenewal.slice(0, 10));
      const daysUntil = differenceInCalendarDays(d, parseISO(today));
      const w = s.wallets.find((x) => x.id === sub.walletId);
      return {
        id: sub.id,
        name: sub.name,
        amount: sub.amount,
        nextRenewal: sub.nextRenewal,
        walletName: w?.name ?? "Wallet",
        daysUntil,
      };
    })
    .filter((r) => r.daysUntil >= 0 && r.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const walletDistribution: WalletDistributionPoint[] = wallets
    .filter((w) => w.balance > 0)
    .map((w) => ({ name: w.name, value: w.balance, color: w.color }));

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    monthlySavings,
    savingsRate,
    wallets,
    recentTransactions,
    expenseByCategory,
    budgetOverview,
    upcomingSubscriptions,
    walletDistribution,
  };
}

export function buildChartData(range?: { from: string; to: string }): ChartPoint[] {
  const s = readState();
  const points: ChartPoint[] = [];
  if (range) {
    const fromDate = parseISO(range.from.slice(0, 10));
    const toDate = parseISO(range.to.slice(0, 10));
    let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const endMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
    while (cursor <= endMonth) {
      const month = cursor.getMonth() + 1;
      const year = cursor.getFullYear();
      const { income, expense } = sumIncomeExpense(s, month, year);
      points.push({ label: format(cursor, "MMM yy"), year, month, income, expense });
      cursor = addMonths(cursor, 1);
    }
  } else {
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = subMonths(now, i);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const { income, expense } = sumIncomeExpense(s, month, year);
      points.push({ label: format(d, "MMM"), year, month, income, expense });
    }
  }
  return points;
}

export function createWallet(payload: {
  name: string;
  type: WalletStored["type"];
  balance: number;
  currency: string;
  color: string;
  icon: string;
}): Wallet {
  const id = newId();
  mutate((draft) => {
    draft.wallets.push({
      id,
      name: payload.name.trim(),
      type: payload.type,
      openingBalance: payload.balance,
      currency: payload.currency || "PKR",
      color: payload.color,
      icon: payload.icon,
      createdAt: new Date().toISOString(),
    });
  });
  return getWalletById(id)!;
}

/** Returns updated wallet — caller should re-fetch list */
export function updateWallet(
  id: string,
  payload: Partial<{
    name: string;
    type: WalletStored["type"];
    openingBalance: number;
    currency: string;
    color: string;
    icon: string;
    pin: string;
  }>
): Wallet | undefined {
  mutate((draft) => {
    const w = draft.wallets.find((x) => x.id === id);
    if (!w) return;
    if (payload.name !== undefined) w.name = payload.name.trim();
    if (payload.type !== undefined) w.type = payload.type;
    if (payload.openingBalance !== undefined) w.openingBalance = payload.openingBalance;
    if (payload.currency !== undefined) w.currency = payload.currency;
    if (payload.color !== undefined) w.color = payload.color;
    if (payload.icon !== undefined) w.icon = payload.icon;
    if (payload.pin !== undefined) w.pin = payload.pin.trim() || undefined;
  });
  return getWalletById(id);
}

export function deleteWallet(id: string): void {
  const s = readState();
  if (s.transactions.some((t) => t.walletId === id)) {
    throw new Error(
      "Cannot delete a wallet that still has transactions. Remove or reassign them first."
    );
  }
  if (s.subscriptions.some((x) => x.walletId === id)) {
    throw new Error("Cannot delete a wallet linked to a subscription.");
  }
  mutate((draft) => {
    draft.wallets = draft.wallets.filter((w) => w.id !== id);
  });
}

export function createTransaction(payload: {
  walletId: string;
  type: Exclude<TransactionStored["type"], "transfer">;
  amount: number;
  category: string;
  description?: string;
  date: string;
  tags?: string[];
}): Transaction {
  const id = newId();
  mutate((draft) => {
    draft.transactions.push({
      id,
      walletId: payload.walletId,
      type: payload.type,
      amount: payload.amount,
      category: payload.category,
      description: payload.description?.trim() ? payload.description.trim() : null,
      date: payload.date,
      tags: payload.tags ?? [],
      createdAt: new Date().toISOString(),
    });
  });
  return listTransactions().find((x) => x.id === id)!;
}

export function updateTransaction(
  id: string,
  payload: Partial<{
    walletId: string;
    type: TransactionStored["type"];
    amount: number;
    category: string;
    description?: string | null;
    date: string;
    tags?: string[];
  }>
): Transaction | undefined {
  const snap = readState();
  const existing = snap.transactions.find((x) => x.id === id);
  if (!existing || existing.transferGroupId) return undefined;
  mutate((draft) => {
    const t = draft.transactions.find((x) => x.id === id);
    if (!t || t.transferGroupId) return;
    if (payload.walletId !== undefined) t.walletId = payload.walletId;
    if (payload.type !== undefined) t.type = payload.type;
    if (payload.amount !== undefined) t.amount = payload.amount;
    if (payload.category !== undefined) t.category = payload.category;
    if (payload.description !== undefined) t.description = payload.description;
    if (payload.date !== undefined) t.date = payload.date;
    if (payload.tags !== undefined) t.tags = payload.tags;
  });
  return listTransactions().find((x) => x.id === id);
}

export function deleteTransaction(id: string): void {
  mutate((draft) => {
    const t = draft.transactions.find((x) => x.id === id);
    if (t?.transferGroupId) {
      const gid = t.transferGroupId;
      draft.transactions = draft.transactions.filter((x) => x.transferGroupId !== gid);
    } else {
      draft.transactions = draft.transactions.filter((x) => x.id !== id);
    }
  });
}

export function recordTransfer(payload: {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  date: string;
  description?: string;
}): { outId: string; inId: string } {
  if (payload.fromWalletId === payload.toWalletId) {
    throw new Error("Source and destination wallets must differ.");
  }
  const gid = newId();
  const desc = payload.description?.trim() || null;
  const createdAt = new Date().toISOString();
  const outId = newId();
  const inId = newId();
  mutate((draft) => {
    draft.transactions.push(
      {
        id: outId,
        walletId: payload.fromWalletId,
        type: "transfer",
        amount: payload.amount,
        category: "Transfer",
        description: desc,
        date: payload.date,
        tags: [],
        createdAt,
        transferGroupId: gid,
        transferDirection: "out",
      },
      {
        id: inId,
        walletId: payload.toWalletId,
        type: "transfer",
        amount: payload.amount,
        category: "Transfer",
        description: desc,
        date: payload.date,
        tags: [],
        createdAt,
        transferGroupId: gid,
        transferDirection: "in",
      }
    );
  });
  return { outId, inId };
}

export function createBudget(payload: {
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
}): BudgetStored {
  let result!: BudgetStored;
  mutate((draft) => {
    const idx = draft.budgets.findIndex(
      (b) => b.month === payload.month && b.year === payload.year && b.category === payload.category
    );
    if (idx >= 0) {
      draft.budgets[idx]!.monthlyLimit = payload.monthlyLimit;
      result = { ...draft.budgets[idx]! };
    } else {
      const id = newId();
      result = {
        id,
        category: payload.category,
        monthlyLimit: payload.monthlyLimit,
        month: payload.month,
        year: payload.year,
      };
      draft.budgets.push(result);
    }
  });
  return result;
}

export function updateBudget(id: string, monthlyLimit: number): BudgetStored | undefined {
  let out: BudgetStored | undefined;
  mutate((draft) => {
    const b = draft.budgets.find((x) => x.id === id);
    if (b) {
      b.monthlyLimit = monthlyLimit;
      out = { ...b };
    }
  });
  return out;
}

export function deleteBudget(id: string): void {
  mutate((draft) => {
    draft.budgets = draft.budgets.filter((b) => b.id !== id);
  });
}

function nextRenewalDate(iso: string, cycle: SubscriptionStored["billingCycle"]): string {
  const d = parseISO(iso.slice(0, 10));
  const next =
    cycle === "monthly" ? addMonths(d, 1) : cycle === "yearly" ? addYears(d, 1) : addWeeks(d, 1);
  return next.toISOString();
}

export function createSubscription(
  payload: Omit<SubscriptionStored, "id" | "createdAt">
): SubscriptionStored {
  const id = newId();
  const row: SubscriptionStored = {
    ...payload,
    id,
    createdAt: new Date().toISOString(),
  };
  mutate((draft) => {
    draft.subscriptions.push(row);
  });
  return row;
}

export function updateSubscription(
  id: string,
  patch: Partial<Omit<SubscriptionStored, "id" | "createdAt">>
): SubscriptionStored | undefined {
  let out: SubscriptionStored | undefined;
  mutate((draft) => {
    const s = draft.subscriptions.find((x) => x.id === id);
    if (!s) return;
    Object.assign(s, patch);
    out = { ...s };
  });
  return out;
}

export function deleteSubscription(id: string): void {
  mutate((draft) => {
    draft.subscriptions = draft.subscriptions.filter((s) => s.id !== id);
  });
}

export function markSubscriptionPaid(id: string): void {
  const snap = readState();
  const sub = snap.subscriptions.find((x) => x.id === id);
  if (!sub) throw new Error("Subscription not found");
  if (sub.status !== "active") throw new Error("Only active subscriptions can be marked paid");
  const txId = newId();
  const next = nextRenewalDate(sub.nextRenewal, sub.billingCycle);
  mutate((draft) => {
    const dSub = draft.subscriptions.find((x) => x.id === id);
    if (!dSub) return;
    draft.transactions.push({
      id: txId,
      walletId: dSub.walletId,
      type: "expense",
      amount: dSub.amount,
      category: dSub.category || "Bills",
      description: `Subscription: ${dSub.name}`,
      date: new Date().toISOString(),
      tags: ["subscription"],
      createdAt: new Date().toISOString(),
      subscriptionId: dSub.id,
    });
    dSub.nextRenewal = next;
  });
}

export function createLoan(payload: Omit<LoanStored, "id" | "createdAt">): LoanStored {
  const id = newId();
  const row: LoanStored = { ...payload, id, createdAt: new Date().toISOString() };
  mutate((draft) => {
    draft.loans.push(row);
  });
  return row;
}

export function updateLoan(
  id: string,
  patch: Partial<Omit<LoanStored, "id" | "createdAt">>
): LoanStored | undefined {
  let out: LoanStored | undefined;
  mutate((draft) => {
    const L = draft.loans.find((x) => x.id === id);
    if (!L) return;
    Object.assign(L, patch);
    out = { ...L };
  });
  return out;
}

export function deleteLoan(id: string): void {
  mutate((draft) => {
    draft.loans = draft.loans.filter((l) => l.id !== id);
  });
}

export function recordLoanPayment(payload: {
  loanId: string;
  walletId: string;
  amount: number;
  date: string;
}): void {
  const s = readState();
  const loan = s.loans.find((l) => l.id === payload.loanId);
  if (!loan) throw new Error("Loan not found");
  const pay = Math.min(payload.amount, loan.remainingBalance);
  if (pay <= 0) throw new Error("Nothing to pay");
  const txId = newId();
  mutate((draft) => {
    const L = draft.loans.find((l) => l.id === payload.loanId);
    if (!L) return;
    L.remainingBalance = Math.max(0, L.remainingBalance - pay);
    draft.transactions.push({
      id: txId,
      walletId: payload.walletId,
      type: "expense",
      amount: pay,
      category: "Bills",
      description: `Loan payment: ${L.name}`,
      date: payload.date,
      tags: ["loan"],
      createdAt: new Date().toISOString(),
      loanId: L.id,
    });
  });
}

export function payoffMonthsEstimate(remaining: number, emi: number): number | null {
  if (emi <= 0 || remaining <= 0) return null;
  return Math.ceil(remaining / emi);
}
