import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type TransactionFilters,
  type CreateTransactionPayload,
} from "@services/transactions";
import { queryKeys } from "@hooks/queryKeys";

export const useTransactions = (filters?: TransactionFilters) =>
  useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: async () => (await fetchTransactions(filters)).data.transactions,
  });

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => createTransaction(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.chart });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
};

export const useUpdateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateTransactionPayload> }) =>
      updateTransaction(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.chart });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.chart });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
};
