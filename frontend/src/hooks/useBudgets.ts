import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBudgets,
  fetchBudgetStatus,
  createBudget,
  updateBudget,
  deleteBudget,
  type CreateBudgetPayload,
} from "@services/budgets";
import { queryKeys } from "@hooks/queryKeys";

export const useBudgets = (month: number, year: number) =>
  useQuery({
    queryKey: queryKeys.budgets.list(month, year),
    queryFn: async () => (await fetchBudgets(month, year)).data,
  });

export const useBudgetStatus = (month: number, year: number) =>
  useQuery({
    queryKey: queryKeys.budgets.status(month, year),
    queryFn: async () => (await fetchBudgetStatus(month, year)).data,
  });

export const useCreateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBudgetPayload) => createBudget(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const useUpdateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, monthlyLimit }: { id: string; monthlyLimit: number }) =>
      updateBudget(id, { monthlyLimit }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const useDeleteBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};
