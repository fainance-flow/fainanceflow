import axios from "@/lib/axios";
import { parseMoney } from "@/utils/currency";
import type { Goal } from "@/utils/types";

export type CreateGoalPayload = {
  title: string;
  targetAmount: number;
  savedAmount?: number;
  deadline?: string | null;
  icon?: string;
};

export type ContributePayload = {
  amount: number;
  note?: string;
};

function mapGoal(g: Goal): Goal {
  return {
    ...g,
    targetAmount: parseMoney(g.targetAmount),
    savedAmount: parseMoney(g.savedAmount),
  };
}

export async function fetchGoals(): Promise<Goal[]> {
  const { data } = await axios.get<{ goals: Goal[] }>("/goals");
  return (data.goals ?? []).map(mapGoal);
}

export async function createGoal(payload: CreateGoalPayload): Promise<Goal> {
  const { data } = await axios.post<{ goal: Goal }>("/goals", payload);
  return mapGoal(data.goal);
}

export async function contributeToGoal(id: string, payload: ContributePayload): Promise<Goal> {
  const { data } = await axios.post<{ goal: Goal }>(`/goals/${id}/contribute`, payload);
  return mapGoal(data.goal);
}

export async function deleteGoal(id: string): Promise<void> {
  await axios.delete(`/goals/${id}`);
}
