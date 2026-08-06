import axios from "@/lib/axios";
import { mapApiTransactionToUi, type ApiTransaction } from "@/lib/finance-api-mappers";
import type { Transaction, TransactionType } from "@/utils/types";

export type TransactionListFilters = {
  from?: string;
  to?: string;
  category?: string;
  accountId?: string;
  type?: TransactionType;
  q?: string;
  limit?: number;
};

export type CreateTransactionPayload = {
  bankAccountId: string;
  type: Exclude<TransactionType, "transfer">;
  amount: number;
  category: string;
  description?: string;
  date: string;
  tags?: string[];
};

export type TransferPayload = {
  fromBankAccountId: string;
  toBankAccountId: string;
  amount: number;
  description?: string;
  date: string;
};

export async function fetchTransactions(filters: TransactionListFilters = {}): Promise<Transaction[]> {
  const { data } = await axios.get<{ transactions: ApiTransaction[] }>("/transactions", {
    params: {
      limit: filters.limit ?? 50,
      from: filters.from,
      to: filters.to,
      category: filters.category,
      accountId: filters.accountId,
      type: filters.type === "transfer" ? undefined : filters.type,
      q: filters.q,
    },
  });
  return (data.transactions ?? []).map(mapApiTransactionToUi);
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  const { data } = await axios.post<{ transaction: ApiTransaction }>("/transactions", payload);
  return mapApiTransactionToUi(data.transaction);
}

export async function transferFunds(payload: TransferPayload): Promise<void> {
  await axios.post("/transactions/transfer", payload);
}

export async function deleteTransaction(id: string): Promise<void> {
  await axios.delete(`/transactions/${id}`);
}
