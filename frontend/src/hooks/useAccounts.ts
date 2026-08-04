import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  type CreateAccountPayload,
  type UpdateAccountPayload,
} from "@services/accounts";
import { queryKeys } from "@hooks/queryKeys";

export const useAccounts = () =>
  useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: async () => (await fetchAccounts()).data.accounts,
  });

export const useCreateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => createAccount(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.chart });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
};

export const useUpdateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAccountPayload }) =>
      updateAccount(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.chart });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
};

export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.chart });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
};
