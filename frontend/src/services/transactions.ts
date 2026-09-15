import { isAxiosError } from "axios";
import axios from "@libs/axios";
import { toast } from "sonner";
import {
  createTransaction as storeCreateTx,
  deleteTransaction as storeDeleteTx,
  listTransactions,
  recordTransfer,
  updateTransaction as storeUpdateTx,
  type TransactionListFilters,
} from "@/lib/finance-store";
import { mapApiTransactionToUi, type ApiTransaction } from "@/lib/finance-api-mappers";
import { shouldUseCloudFinance } from "@/lib/finance-backend-mode";
import { enqueueTransaction, listQueuedTransactions } from "@lib/offline-queue";
import { readOfflineCache, writeOfflineCache } from "@lib/offline-read-cache";
import { queryClient } from "@lib/query-client";
import { queryKeys } from "@hooks/queryKeys";
import type { Transaction, TransactionType, Wallet } from "@utils/types";

export type TransactionFilters = TransactionListFilters;

export type CreateTransactionPayload = {
  walletId?: string;
  /** @deprecated use walletId */
  bankAccountId?: string;
  toWalletId?: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  date: string;
  tags?: string[];
};

function calendarKey(iso: string): string {
  return iso.slice(0, 10);
}

const TRANSACTIONS_CACHE_KEY = "transactions";

/** No response at all reached us — offline, DNS failure, timeout — as opposed to a real 4xx/5xx. */
function isOfflineError(err: unknown): boolean {
  return isAxiosError(err) && !err.response;
}

function walletSnapshot(walletId: string): Transaction["wallet"] {
  const wallets = queryClient.getQueryData<Wallet[]>(queryKeys.accounts.all);
  const w = wallets?.find((x) => x.id === walletId);
  return w ? { id: w.id, name: w.name, color: w.color, icon: w.icon } : undefined;
}

async function queueOfflineTransaction(
  walletId: string,
  payload: CreateTransactionPayload
): Promise<Transaction> {
  const id = `pending-${crypto.randomUUID()}`;
  const wallet = walletSnapshot(walletId);
  const type = payload.type as "income" | "expense";

  await enqueueTransaction({
    id,
    payload: {
      bankAccountId: walletId,
      type,
      amount: payload.amount,
      category: payload.category,
      description: payload.description,
      date: payload.date,
      tags: payload.tags,
    },
    wallet,
    createdAt: new Date().toISOString(),
  });

  toast("Offline — entry save ho gayi, net anay par khud sync ho jayegi.");

  return {
    id,
    type,
    amount: payload.amount,
    category: payload.category,
    description: payload.description ?? null,
    date: payload.date,
    tags: payload.tags,
    wallet,
    pending: true,
  };
}

function applyTxFilters(rows: Transaction[], filters?: TransactionListFilters): Transaction[] {
  if (!filters) return rows;
  let out = rows;
  const accountFilter = filters.walletId ?? filters.accountId;
  if (accountFilter) {
    out = out.filter((t) => t.wallet?.id === accountFilter);
  }
  if (filters.category) out = out.filter((t) => t.category === filters.category);
  if (filters.type) out = out.filter((t) => t.type === filters.type);
  if (filters.from) {
    const f = calendarKey(filters.from);
    out = out.filter((t) => calendarKey(t.date) >= f);
  }
  if (filters.to) {
    const f = calendarKey(filters.to);
    out = out.filter((t) => calendarKey(t.date) <= f);
  }
  if (filters.minAmount !== undefined) {
    out = out.filter((t) => t.amount >= filters.minAmount!);
  }
  if (filters.maxAmount !== undefined) {
    out = out.filter((t) => t.amount <= filters.maxAmount!);
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    out = out.filter((t) =>
      `${t.description ?? ""} ${t.category} ${(t.tags ?? []).join(" ")}`.toLowerCase().includes(q)
    );
  }
  if (filters.limit) out = out.slice(0, filters.limit);
  return out;
}

export const fetchTransactions = async (
  params?: TransactionFilters
): Promise<{ data: { transactions: Transaction[] } }> => {
  if (!shouldUseCloudFinance()) {
    return { data: { transactions: listTransactions(params) } };
  }

  const query: Record<string, string | number | undefined> = {
    limit: params?.limit ?? 500,
  };
  if (params?.from) query.from = params.from.slice(0, 10);
  if (params?.to) query.to = params.to.slice(0, 10);
  if (params?.category) query.category = params.category;
  const walletId = params?.walletId ?? params?.accountId;
  if (walletId) query.accountId = walletId;
  if (params?.type) query.type = params.type;
  if (params?.q) query.q = params.q;

  let mapped: Transaction[];
  try {
    const { data } = await axios.get<{ transactions: ApiTransaction[] }>("/transactions", {
      params: query,
    });
    mapped = data.transactions.map(mapApiTransactionToUi);
    writeOfflineCache(TRANSACTIONS_CACHE_KEY, mapped);
  } catch (err) {
    if (!isOfflineError(err)) throw err;
    // Offline with nothing fresh to show. Try the in-memory cache for this exact
    // filter combo first (covers "went offline mid-session"); a cold reload wipes
    // that, so fall further back to the last successfully fetched snapshot on disk
    // (covers "reopened the app while already offline").
    const inMemory = queryClient.getQueryData<Transaction[]>(queryKeys.transactions.list(params));
    const fallback = inMemory ?? readOfflineCache<Transaction[]>(TRANSACTIONS_CACHE_KEY) ?? [];
    mapped = fallback.filter((t) => !t.pending);
  }

  const queued = await listQueuedTransactions();
  const pending: Transaction[] = queued.map((q) => ({
    id: q.id,
    type: q.payload.type,
    amount: q.payload.amount,
    category: q.payload.category,
    description: q.payload.description ?? null,
    date: q.payload.date,
    tags: q.payload.tags,
    wallet: q.wallet,
    pending: true,
  }));

  return { data: { transactions: applyTxFilters([...pending, ...mapped], params) } };
};

export const createTransaction = async (
  payload: CreateTransactionPayload
): Promise<{ data: { transaction: Transaction } }> => {
  const walletId = payload.walletId ?? payload.bankAccountId;
  if (!walletId) throw new Error("Pick a wallet");

  if (!shouldUseCloudFinance()) {
    if (payload.type === "transfer") {
      if (!payload.toWalletId) throw new Error("Pick a destination wallet");
      const { outId } = recordTransfer({
        fromWalletId: walletId,
        toWalletId: payload.toWalletId,
        amount: payload.amount,
        date: payload.date,
        description: payload.description,
      });
      const tx = listTransactions().find((t) => t.id === outId);
      if (!tx) throw new Error("Transfer failed");
      return { data: { transaction: tx } };
    }
    if (payload.type === "income" || payload.type === "expense") {
      const transaction = storeCreateTx({
        walletId,
        type: payload.type,
        amount: payload.amount,
        category: payload.category,
        description: payload.description,
        date: payload.date,
        tags: payload.tags,
      });
      return { data: { transaction } };
    }
    throw new Error("Unsupported transaction type");
  }

  if (payload.type === "transfer") {
    if (!payload.toWalletId) throw new Error("Pick a destination wallet");
    const { data } = await axios.post<{ ok: true; out: ApiTransaction; in: ApiTransaction }>(
      "/transactions/transfer",
      {
        fromBankAccountId: walletId,
        toBankAccountId: payload.toWalletId,
        amount: payload.amount,
        description: payload.description ?? undefined,
        date: new Date(`${payload.date.slice(0, 10)}T12:00:00`),
      }
    );
    return { data: { transaction: mapApiTransactionToUi(data.out) } };
  }

  if (payload.type === "income" || payload.type === "expense") {
    try {
      const { data } = await axios.post<{ transaction: ApiTransaction }>("/transactions", {
        bankAccountId: walletId,
        type: payload.type,
        amount: payload.amount,
        category: payload.category,
        description: payload.description ?? undefined,
        date: new Date(`${payload.date.slice(0, 10)}T12:00:00`),
        tags: payload.tags ?? [],
      });
      return { data: { transaction: mapApiTransactionToUi(data.transaction) } };
    } catch (err) {
      if (!isOfflineError(err)) throw err;
      return { data: { transaction: await queueOfflineTransaction(walletId, payload) } };
    }
  }

  throw new Error("Unsupported transaction type");
};

export const updateTransaction = async (
  id: string,
  payload: Partial<CreateTransactionPayload>
): Promise<{ data: { transaction: Transaction } }> => {
  if (!shouldUseCloudFinance()) {
    const mapped: Parameters<typeof storeUpdateTx>[1] = {};
    if (payload.walletId ?? payload.bankAccountId) {
      mapped.walletId = payload.walletId ?? payload.bankAccountId;
    }
    if (payload.type !== undefined) mapped.type = payload.type;
    if (payload.amount !== undefined) mapped.amount = payload.amount;
    if (payload.category !== undefined) mapped.category = payload.category;
    if (payload.description !== undefined) mapped.description = payload.description;
    if (payload.date !== undefined) mapped.date = payload.date;
    if (payload.tags !== undefined) mapped.tags = payload.tags;

    const transaction = storeUpdateTx(id, mapped);
    if (!transaction) throw new Error("Transaction not found or cannot be edited");
    return { data: { transaction } };
  }

  const body: Record<string, unknown> = {};
  const wid = payload.walletId ?? payload.bankAccountId;
  if (wid !== undefined) body.bankAccountId = wid;
  if (payload.type !== undefined) body.type = payload.type;
  if (payload.amount !== undefined) body.amount = payload.amount;
  if (payload.category !== undefined) body.category = payload.category;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.date !== undefined) body.date = new Date(`${payload.date.slice(0, 10)}T12:00:00`);
  if (payload.tags !== undefined) body.tags = payload.tags;

  const { data } = await axios.put<{ transaction: ApiTransaction }>(`/transactions/${id}`, body);
  return { data: { transaction: mapApiTransactionToUi(data.transaction) } };
};

export const deleteTransaction = async (id: string): Promise<{ data: { ok: true } }> => {
  if (!shouldUseCloudFinance()) {
    storeDeleteTx(id);
    return { data: { ok: true } };
  }
  await axios.delete(`/transactions/${id}`);
  return { data: { ok: true } };
};

export const fetchTransactionsSummary = async (): Promise<{ data: unknown }> => ({
  data: {},
});
