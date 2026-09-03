import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { INTERNAL_TRANSFER_TAG, transferPairTag } from "../lib/transferTags";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import { badRequest, notFound } from "../utils/httpError";
import { redis, dashboardKey } from "../lib/redis";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  bankAccountId: z.string().min(1),
  type: z.nativeEnum(TransactionType),
  amount: z.number().positive(),
  category: z.string().min(1).max(60),
  description: z.string().max(280).optional().nullable(),
  date: z.coerce.date(),
  tags: z.array(z.string()).optional().default([]),
});

const updateSchema = createSchema.partial();

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  category: z.string().optional(),
  accountId: z.string().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  cursor: z.string().optional(),
});

const transferSchema = z.object({
  fromBankAccountId: z.string().min(1),
  toBankAccountId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().max(280).optional().nullable(),
  date: z.coerce.date(),
});

/**
 * Apply the side effect of a transaction on an account's balance.
 * income → +amount, expense → -amount. Transfers are recorded on source account as expense-equivalent.
 */
function balanceDelta(type: TransactionType, amount: Prisma.Decimal): Prisma.Decimal {
  if (type === TransactionType.income) return amount;
  return amount.neg();
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const q = querySchema.parse(req.query);

    const where: Prisma.TransactionWhereInput = { userId };
    if (q.from || q.to) {
      where.date = {};
      if (q.from) where.date.gte = q.from;
      if (q.to) where.date.lte = q.to;
    }
    if (q.category) where.category = q.category;
    if (q.accountId) where.bankAccountId = q.accountId;
    if (q.type) where.type = q.type;
    if (q.q) where.description = { contains: q.q, mode: "insensitive" };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: q.limit,
      ...(q.cursor ? { skip: 1, cursor: { id: q.cursor } } : {}),
      include: { account: { select: { id: true, bankName: true, color: true, icon: true } } },
    });

    res.json({ transactions });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = createSchema.parse(req.body);

    const account = await prisma.bankAccount.findFirst({
      where: { id: data.bankAccountId, userId },
    });
    if (!account) throw notFound("Account not found");

    const amount = new Prisma.Decimal(data.amount);

    const tx = await prisma.$transaction(async (db) => {
      const created = await db.transaction.create({
        data: {
          userId,
          bankAccountId: data.bankAccountId,
          type: data.type,
          amount,
          category: data.category,
          description: data.description ?? null,
          date: data.date,
          tags: data.tags ?? [],
        },
      });
      await db.bankAccount.update({
        where: { id: data.bankAccountId },
        data: { balance: { increment: balanceDelta(data.type, amount) } },
      });
      return created;
    });

    await redis.del(dashboardKey(userId));
    res.status(201).json({ transaction: tx });
  })
);

router.post(
  "/transfer",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = transferSchema.parse(req.body);

    if (data.fromBankAccountId === data.toBankAccountId) {
      throw badRequest("Source and destination accounts must differ");
    }

    const [from, to] = await Promise.all([
      prisma.bankAccount.findFirst({ where: { id: data.fromBankAccountId, userId } }),
      prisma.bankAccount.findFirst({ where: { id: data.toBankAccountId, userId } }),
    ]);
    if (!from || !to) throw notFound("Account not found");

    const amount = new Prisma.Decimal(data.amount);
    const pairTag = transferPairTag(randomUUID());
    const xferTags = [INTERNAL_TRANSFER_TAG, pairTag];
    const desc = data.description?.trim() ?? null;

    const accountSelect = { id: true, bankName: true, color: true, icon: true } as const;

    const { outLeg, inLeg } = await prisma.$transaction(async (db) => {
      const outLeg = await db.transaction.create({
        data: {
          userId,
          bankAccountId: data.fromBankAccountId,
          type: TransactionType.expense,
          amount,
          category: "Transfer",
          description: desc ?? `To ${to.bankName}`,
          date: data.date,
          tags: xferTags,
        },
        include: { account: { select: accountSelect } },
      });
      await db.bankAccount.update({
        where: { id: data.fromBankAccountId },
        data: { balance: { increment: balanceDelta(TransactionType.expense, amount) } },
      });

      const inLeg = await db.transaction.create({
        data: {
          userId,
          bankAccountId: data.toBankAccountId,
          type: TransactionType.income,
          amount,
          category: "Transfer",
          description: desc ?? `From ${from.bankName}`,
          date: data.date,
          tags: xferTags,
        },
        include: { account: { select: accountSelect } },
      });
      await db.bankAccount.update({
        where: { id: data.toBankAccountId },
        data: { balance: { increment: balanceDelta(TransactionType.income, amount) } },
      });

      return { outLeg, inLeg };
    });

    await redis.del(dashboardKey(userId));
    res.status(201).json({ ok: true, out: outLeg, in: inLeg });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw notFound("Transaction not found");
    if (existing.tags.includes(INTERNAL_TRANSFER_TAG)) {
      throw badRequest("Transfer legs cannot be edited — delete and recreate the transfer");
    }

    const data = updateSchema.parse(req.body);

    const newAccountId = data.bankAccountId ?? existing.bankAccountId;
    const newType = data.type ?? existing.type;
    const newAmount = data.amount !== undefined ? new Prisma.Decimal(data.amount) : existing.amount;

    if (data.bankAccountId && data.bankAccountId !== existing.bankAccountId) {
      const owned = await prisma.bankAccount.findFirst({
        where: { id: data.bankAccountId, userId },
      });
      if (!owned) throw notFound("Target account not found");
    }

    const tx = await prisma.$transaction(async (db) => {
      // Revert old impact
      await db.bankAccount.update({
        where: { id: existing.bankAccountId },
        data: { balance: { increment: balanceDelta(existing.type, existing.amount).neg() } },
      });
      // Apply new impact
      await db.bankAccount.update({
        where: { id: newAccountId },
        data: { balance: { increment: balanceDelta(newType, newAmount) } },
      });
      return db.transaction.update({
        where: { id },
        data: {
          ...(data.bankAccountId && { bankAccountId: data.bankAccountId }),
          ...(data.type && { type: data.type }),
          ...(data.amount !== undefined && { amount: newAmount }),
          ...(data.category && { category: data.category }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.date && { date: data.date }),
          ...(data.tags && { tags: data.tags }),
        },
      });
    });

    await redis.del(dashboardKey(userId));
    res.json({ transaction: tx });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw notFound("Transaction not found");

    const pairTag = existing.tags.find((t) => t.startsWith("ff-pair:"));
    const victims =
      pairTag && existing.tags.includes(INTERNAL_TRANSFER_TAG)
        ? await prisma.transaction.findMany({
            where: { userId, tags: { has: pairTag } },
          })
        : [existing];

    await prisma.$transaction(async (db) => {
      for (const row of victims) {
        await db.bankAccount.update({
          where: { id: row.bankAccountId },
          data: { balance: { increment: balanceDelta(row.type, row.amount).neg() } },
        });
        await db.transaction.delete({ where: { id: row.id } });
      }
    });

    await redis.del(dashboardKey(userId));
    res.json({ ok: true });
  })
);

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const now = new Date();
    const month = Number(req.query.month ?? now.getMonth() + 1);
    const year = Number(req.query.year ?? now.getFullYear());

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const grouped = await prisma.transaction.groupBy({
      by: ["category", "type"],
      where: {
        userId,
        date: { gte: start, lte: end },
        NOT: { tags: { has: INTERNAL_TRANSFER_TAG } },
      },
      _sum: { amount: true },
    });

    res.json({
      month,
      year,
      summary: grouped.map((g) => ({
        category: g.category,
        type: g.type,
        total: g._sum.amount?.toString() ?? "0",
      })),
    });
  })
);

export default router;
