import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  payLoan,
  type CreateLoanPayload,
} from "@services/loans";
import { queryKeys } from "@hooks/queryKeys";

export const useLoans = () =>
  useQuery({
    queryKey: queryKeys.loans.all,
    queryFn: async () => (await fetchLoans()).data.loans,
  });

export const useCreateLoan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLoanPayload) => createLoan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.loans.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const useUpdateLoan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CreateLoanPayload> }) =>
      updateLoan(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.loans.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const useDeleteLoan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLoan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.loans.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const usePayLoan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { loanId: string; walletId: string; amount: number; date: string }) =>
      payLoan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.loans.all });
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.chart });
    },
  });
};
