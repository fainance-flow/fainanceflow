import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchGoals,
  createGoal,
  updateGoal,
  contributeToGoal,
  deleteGoal,
  type CreateGoalPayload,
  type ContributePayload,
} from "@services/goals";
import { queryKeys } from "@hooks/queryKeys";

export const useGoals = () =>
  useQuery({
    queryKey: queryKeys.goals.all,
    queryFn: async () => (await fetchGoals()).data.goals,
  });

export const useCreateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => createGoal(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateGoalPayload> }) =>
      updateGoal(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
};

export const useContributeToGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ContributePayload }) =>
      contributeToGoal(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
    },
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goals.all });
    },
  });
};
