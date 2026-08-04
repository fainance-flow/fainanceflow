import axios from "@libs/axios";
import {
  buildBudgetStatus,
  createBudget as storeCreateBudget,
  deleteBudget as storeDeleteBudget,
  listBudgetsRaw,
  updateBudget as storeUpdateBudget,
} from "@/lib/finance-store";
import { parseMoney } from "@/lib/finance-api-mappers";
import { shouldUseCloudFinance } from "@/lib/finance-backend-mode";
import type { Budget, BudgetStatus } from "@utils/types";

export type CreateBudgetPayload = {
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
};

type ApiBudget = {
  id: string;
  category: string;
  monthlyLimit: unknown;
  month: number;
  year: number;
};

export const fetchBudgets = async (
  month?: number,
  year?: number
): Promise<{ data: { budgets: Budget[]; month: number; year: number } }> => {
  const m = month ?? new Date().getMonth() + 1;
  const y = year ?? new Date().getFullYear();

  if (!shouldUseCloudFinance()) {
    const rows = listBudgetsRaw(m, y);
    const budgets: Budget[] = rows.map((b) => ({
      id: b.id,
      category: b.category,
      monthlyLimit: b.monthlyLimit,
      month: b.month,
      year: b.year,
    }));
    return { data: { budgets, month: m, year: y } };
  }

  const { data } = await axios.get<{ budgets: ApiBudget[]; month: number; year: number }>(
    "/budgets",
    { params: { month: m, year: y } }
  );
  const budgets: Budget[] = data.budgets.map((b) => ({
    id: b.id,
    category: b.category,
    monthlyLimit: parseMoney(b.monthlyLimit),
    month: b.month,
    year: b.year,
  }));
  return { data: { budgets, month: data.month, year: data.year } };
};

export const fetchBudgetStatus = async (
  month?: number,
  year?: number
): Promise<{ data: { status: BudgetStatus[]; month: number; year: number } }> => {
  const m = month ?? new Date().getMonth() + 1;
  const y = year ?? new Date().getFullYear();

  if (!shouldUseCloudFinance()) {
    return { data: { status: buildBudgetStatus(m, y), month: m, year: y } };
  }

  const { data } = await axios.get<{ status: BudgetStatus[]; month: number; year: number }>(
    "/budgets/status",
    { params: { month: m, year: y } }
  );
  return { data: { status: data.status, month: data.month, year: data.year } };
};

export const createBudget = async (
  payload: CreateBudgetPayload
): Promise<{ data: { budget: Budget } }> => {
  if (!shouldUseCloudFinance()) {
    const b = storeCreateBudget(payload);
    return {
      data: {
        budget: {
          id: b.id,
          category: b.category,
          monthlyLimit: b.monthlyLimit,
          month: b.month,
          year: b.year,
        },
      },
    };
  }

  const { data } = await axios.post<{ budget: ApiBudget }>("/budgets", payload);
  const b = data.budget;
  return {
    data: {
      budget: {
        id: b.id,
        category: b.category,
        monthlyLimit: parseMoney(b.monthlyLimit),
        month: b.month,
        year: b.year,
      },
    },
  };
};

export const updateBudget = async (
  id: string,
  payload: { monthlyLimit: number }
): Promise<{ data: { budget: Budget } }> => {
  if (!shouldUseCloudFinance()) {
    const b = storeUpdateBudget(id, payload.monthlyLimit);
    if (!b) throw new Error("Budget not found");
    return {
      data: {
        budget: {
          id: b.id,
          category: b.category,
          monthlyLimit: b.monthlyLimit,
          month: b.month,
          year: b.year,
        },
      },
    };
  }

  const { data } = await axios.put<{ budget: ApiBudget }>(`/budgets/${id}`, payload);
  const b = data.budget;
  return {
    data: {
      budget: {
        id: b.id,
        category: b.category,
        monthlyLimit: parseMoney(b.monthlyLimit),
        month: b.month,
        year: b.year,
      },
    },
  };
};

export const deleteBudget = async (id: string): Promise<{ data: { ok: true } }> => {
  if (!shouldUseCloudFinance()) {
    storeDeleteBudget(id);
    return { data: { ok: true } };
  }
  await axios.delete(`/budgets/${id}`);
  return { data: { ok: true } };
};
