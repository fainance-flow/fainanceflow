import axios from "@/lib/axios";
import { parseMoney } from "@/utils/currency";
import type { BudgetStatus } from "@/utils/types";

export type Budget = {
  id: string;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
};

export type CreateBudgetPayload = {
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
};

export async function fetchBudgetStatus(month: number, year: number): Promise<BudgetStatus[]> {
  const { data } = await axios.get<{ status: BudgetStatus[] }>("/budgets/status", {
    params: { month, year },
  });
  return (data.status ?? []).map((s) => ({
    ...s,
    limit: parseMoney(s.limit),
    spent: parseMoney(s.spent),
    remaining: parseMoney(s.remaining),
  }));
}

export async function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  const { data } = await axios.post<{ budget: Budget }>("/budgets", payload);
  return {
    ...data.budget,
    monthlyLimit: parseMoney(data.budget.monthlyLimit),
  };
}

export async function deleteBudget(id: string): Promise<void> {
  await axios.delete(`/budgets/${id}`);
}
