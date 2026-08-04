import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  paySubscription,
  type CreateSubscriptionPayload,
} from "@services/subscriptions";
import { queryKeys } from "@hooks/queryKeys";

export const useSubscriptions = () =>
  useQuery({
    queryKey: queryKeys.subscriptions.all,
    queryFn: async () => (await fetchSubscriptions()).data.subscriptions,
  });

export const useCreateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) => createSubscription(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const useUpdateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CreateSubscriptionPayload> }) =>
      updateSubscription(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const useDeleteSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubscription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const usePaySubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paySubscription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.chart });
    },
  });
};
