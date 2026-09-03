import axios from "@libs/axios";
import { parseMoney } from "@/lib/finance-api-mappers";
import { shouldUseCloudFinance } from "@/lib/finance-backend-mode";
import type { Goal, GoalContributionRecord, GoalStatus } from "@utils/types";

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

type ApiGoal = {
  id: string;
  title: string;
  targetAmount: unknown;
  savedAmount: unknown;
  deadline: string | null;
  icon: string;
  status: GoalStatus;
  contributions?: {
    id: string;
    amount: unknown;
    date: string;
    note: string | null;
  }[];
};

function mapGoal(g: ApiGoal): Goal {
  return {
    id: g.id,
    title: g.title,
    targetAmount: parseMoney(g.targetAmount),
    savedAmount: parseMoney(g.savedAmount),
    deadline: g.deadline ? new Date(g.deadline).toISOString().slice(0, 10) : null,
    icon: g.icon,
    status: g.status,
    contributions: (g.contributions ?? []).map((c): GoalContributionRecord => ({
      id: c.id,
      amount: parseMoney(c.amount),
      date: new Date(c.date).toISOString().slice(0, 10),
      note: c.note,
    })),
  };
}

export const fetchGoals = async (): Promise<{ data: { goals: Goal[] } }> => {
  if (!shouldUseCloudFinance()) return { data: { goals: [] } };
  const { data } = await axios.get<{ goals: ApiGoal[] }>("/goals");
  return { data: { goals: data.goals.map(mapGoal) } };
};

export const createGoal = async (payload: CreateGoalPayload): Promise<{ data: { goal: Goal } }> => {
  if (!shouldUseCloudFinance()) {
    throw new Error("Goals are available after you sign in — data is saved on the server.");
  }
  const { data } = await axios.post<{ goal: ApiGoal }>("/goals", {
    title: payload.title,
    targetAmount: payload.targetAmount,
    savedAmount: payload.savedAmount ?? 0,
    deadline: payload.deadline ? new Date(payload.deadline) : null,
    icon: payload.icon ?? "target",
  });
  return { data: { goal: mapGoal(data.goal) } };
};

export const updateGoal = async (
  id: string,
  payload: Partial<CreateGoalPayload>
): Promise<{ data: { goal: Goal } }> => {
  if (!shouldUseCloudFinance()) {
    throw new Error("Goals are available after you sign in — data is saved on the server.");
  }
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.targetAmount !== undefined) body.targetAmount = payload.targetAmount;
  if (payload.savedAmount !== undefined) body.savedAmount = payload.savedAmount;
  if (payload.deadline !== undefined) {
    body.deadline = payload.deadline ? new Date(payload.deadline) : null;
  }
  if (payload.icon !== undefined) body.icon = payload.icon;

  const { data } = await axios.put<{ goal: ApiGoal }>(`/goals/${id}`, body);
  return { data: { goal: mapGoal(data.goal) } };
};

export const contributeToGoal = async (
  id: string,
  payload: ContributePayload
): Promise<{ data: { goal: Goal; justCompleted: boolean } }> => {
  if (!shouldUseCloudFinance()) {
    throw new Error("Goals are available after you sign in — data is saved on the server.");
  }
  const { data } = await axios.post<{ goal: ApiGoal; justCompleted: boolean }>(
    `/goals/${id}/contribute`,
    payload
  );
  return { data: { goal: mapGoal(data.goal), justCompleted: data.justCompleted } };
};

export const deleteGoal = async (id: string): Promise<{ data: { ok: true } }> => {
  if (!shouldUseCloudFinance()) {
    return { data: { ok: true } };
  }
  await axios.delete(`/goals/${id}`);
  return { data: { ok: true } };
};
