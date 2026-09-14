import { Router } from "express";
import { TransactionType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { INTERNAL_TRANSFER_TAG } from "../lib/transferTags";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import { dashboardKey, DASHBOARD_CACHE_TTL_SECONDS, safeGet, safeSet } from "../lib/redis";

const router = Router();
router.use(requireAuth);

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const key = dashboardKey(userId);
    const cached = await safeGet(key);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(JSON.parse(cached));
      return;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [accounts, income, expense, recent, topGoals] = await Promise.all([
      prisma.bankAccount.findMany({ where: { userId } }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.income,
          date: { gte: monthStart, lte: monthEnd },
          NOT: { tags: { has: INTERNAL_TRANSFER_TAG } },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.expense,
          date: { gte: monthStart, lte: monthEnd },
          NOT: { tags: { has: INTERNAL_TRANSFER_TAG } },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 5,
        include: { account: { select: { id: true, bankName: true, color: true, icon: true } } },
      }),
      prisma.goal.findMany({
        where: { userId, status: "active" },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const monthlyIncome = Number(income._sum.amount ?? 0);
    const monthlyExpense = Number(expense._sum.amount ?? 0);
    const savings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? Math.round((savings / monthlyIncome) * 1000) / 10 : 0;

    // Expense breakdown by category for current month
    const byCategory = await prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId,
        type: TransactionType.expense,
        date: { gte: monthStart, lte: monthEnd },
        NOT: { tags: { has: INTERNAL_TRANSFER_TAG } },
      },
      _sum: { amount: true },
    });

    const payload = {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlySavings: savings,
      savingsRate,
      accounts: accounts.map((a) => ({
        id: a.id,
        bankName: a.bankName,
        accountType: a.accountType,
        balance: Number(a.balance),
        color: a.color,
        icon: a.icon,
      })),
      recentTransactions: recent.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        category: t.category,
        description: t.description,
        date: t.date,
        tags: t.tags,
        account: t.account,
      })),
      expenseByCategory: byCategory
        .map((c) => ({ category: c.category, total: Number(c._sum.amount ?? 0) }))
        .sort((a, b) => b.total - a.total),
      topGoals: topGoals.map((g) => {
        const target = Number(g.targetAmount);
        const saved = Number(g.savedAmount);
        return {
          id: g.id,
          title: g.title,
          icon: g.icon,
          target,
          saved,
          pct: target > 0 ? Math.round((saved / target) * 1000) / 10 : 0,
          deadline: g.deadline,
        };
      }),
    };

    await safeSet(key, JSON.stringify(payload), DASHBOARD_CACHE_TTL_SECONDS);
    res.setHeader("X-Cache", "MISS");
    res.json(payload);
  })
);

router.get(
  "/chart-data",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const now = new Date();
    const months: {
      label: string;
      year: number;
      month: number;
      income: number;
      expense: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.income,
            date: { gte: start, lte: end },
            NOT: { tags: { has: INTERNAL_TRANSFER_TAG } },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.expense,
            date: { gte: start, lte: end },
            NOT: { tags: { has: INTERNAL_TRANSFER_TAG } },
          },
          _sum: { amount: true },
        }),
      ]);

      months.push({
        label: start.toLocaleString("en-US", { month: "short" }),
        year: start.getFullYear(),
        month: start.getMonth() + 1,
        income: Number(inc._sum.amount ?? 0),
        expense: Number(exp._sum.amount ?? 0),
      });
    }

    res.json({ months });
  })
);

export default router;
