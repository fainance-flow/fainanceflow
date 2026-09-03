import { Router } from "express";
import { z } from "zod";
import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { INTERNAL_TRANSFER_TAG } from "../lib/transferTags";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import { badRequest, notFound } from "../utils/httpError";

const router = Router();
router.use(requireAuth);

const monthSchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

const createSchema = z.object({
  category: z.string().min(1).max(60),
  monthlyLimit: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

const updateSchema = z.object({
  monthlyLimit: z.number().positive().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const now = new Date();
    const q = monthSchema.parse(req.query);
    const month = q.month ?? now.getMonth() + 1;
    const year = q.year ?? now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: { userId, month, year },
      orderBy: { category: "asc" },
    });
    res.json({ month, year, budgets });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = createSchema.parse(req.body);

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month_year: {
          userId,
          category: data.category,
          month: data.month,
          year: data.year,
        },
      },
      create: {
        userId,
        category: data.category,
        monthlyLimit: new Prisma.Decimal(data.monthlyLimit),
        month: data.month,
        year: data.year,
      },
      update: {
        monthlyLimit: new Prisma.Decimal(data.monthlyLimit),
      },
    });
    res.status(201).json({ budget });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const owned = await prisma.budget.findFirst({ where: { id, userId } });
    if (!owned) throw notFound("Budget not found");

    const data = updateSchema.parse(req.body);
    const budget = await prisma.budget.update({
      where: { id },
      data: {
        ...(data.monthlyLimit !== undefined && {
          monthlyLimit: new Prisma.Decimal(data.monthlyLimit),
        }),
      },
    });
    res.json({ budget });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const owned = await prisma.budget.findFirst({ where: { id, userId } });
    if (!owned) throw notFound("Budget not found");

    await prisma.budget.delete({ where: { id } });
    res.json({ ok: true });
  })
);

router.get(
  "/status",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const now = new Date();
    const q = monthSchema.parse(req.query);
    const month = q.month ?? now.getMonth() + 1;
    const year = q.year ?? now.getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [budgets, spent] = await Promise.all([
      prisma.budget.findMany({ where: { userId, month, year } }),
      prisma.transaction.groupBy({
        by: ["category"],
        where: {
          userId,
          type: TransactionType.expense,
          date: { gte: start, lte: end },
          NOT: { tags: { has: INTERNAL_TRANSFER_TAG } },
        },
        _sum: { amount: true },
      }),
    ]);

    const spentMap = new Map(spent.map((s) => [s.category, Number(s._sum.amount ?? 0)]));

    const status = budgets.map((b) => {
      const used = spentMap.get(b.category) ?? 0;
      const limit = Number(b.monthlyLimit);
      const pct = limit > 0 ? Math.min((used / limit) * 100, 999) : 0;
      return {
        id: b.id,
        category: b.category,
        limit,
        spent: used,
        remaining: Math.max(limit - used, 0),
        pct: Math.round(pct * 10) / 10,
        state: pct >= 100 ? "over" : pct >= 80 ? "warn" : "ok",
      };
    });

    res.json({ month, year, status });
  })
);

export default router;
