import { Router } from "express";
import { z } from "zod";
import { Prisma, GoalStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import { badRequest, notFound } from "../utils/httpError";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1).max(80),
  targetAmount: z.number().positive(),
  savedAmount: z.number().nonnegative().optional().default(0),
  deadline: z.coerce.date().optional().nullable(),
  icon: z.string().min(1).max(40).optional(),
  status: z.nativeEnum(GoalStatus).optional(),
});

const updateSchema = createSchema.partial();

const contributeSchema = z.object({
  amount: z.number().positive(),
  note: z.string().max(200).optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { contributions: { orderBy: { date: "desc" }, take: 5 } },
    });
    res.json({ goals });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = createSchema.parse(req.body);
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: data.title,
        targetAmount: new Prisma.Decimal(data.targetAmount),
        savedAmount: new Prisma.Decimal(data.savedAmount ?? 0),
        deadline: data.deadline ?? null,
        icon: data.icon ?? "target",
        status: data.status ?? GoalStatus.active,
      },
    });
    res.status(201).json({ goal });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const owned = await prisma.goal.findFirst({ where: { id, userId } });
    if (!owned) throw notFound("Goal not found");

    const data = updateSchema.parse(req.body);
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.targetAmount !== undefined && {
          targetAmount: new Prisma.Decimal(data.targetAmount),
        }),
        ...(data.savedAmount !== undefined && {
          savedAmount: new Prisma.Decimal(data.savedAmount),
        }),
        ...(data.deadline !== undefined && { deadline: data.deadline }),
        ...(data.icon && { icon: data.icon }),
        ...(data.status && { status: data.status }),
      },
    });
    res.json({ goal });
  })
);

router.post(
  "/:id/contribute",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw notFound("Goal not found");

    const data = contributeSchema.parse(req.body);
    const amount = new Prisma.Decimal(data.amount);

    const result = await prisma.$transaction(async (db) => {
      await db.goalContribution.create({
        data: { goalId: id, amount, note: data.note ?? null },
      });
      const newSaved = goal.savedAmount.plus(amount);
      const completed = newSaved.gte(goal.targetAmount);
      return db.goal.update({
        where: { id },
        data: {
          savedAmount: newSaved,
          ...(completed && { status: GoalStatus.completed }),
        },
      });
    });

    res.json({ goal: result, justCompleted: result.status === GoalStatus.completed });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const owned = await prisma.goal.findFirst({ where: { id, userId } });
    if (!owned) throw notFound("Goal not found");

    await prisma.goal.delete({ where: { id } });
    res.json({ ok: true });
  })
);

router.get(
  "/progress",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const progress = goals.map((g) => {
      const target = Number(g.targetAmount);
      const saved = Number(g.savedAmount);
      const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
      return {
        id: g.id,
        title: g.title,
        icon: g.icon,
        status: g.status,
        target,
        saved,
        remaining: Math.max(target - saved, 0),
        pct: Math.round(pct * 10) / 10,
        deadline: g.deadline,
      };
    });

    res.json({ progress });
  })
);

export default router;
