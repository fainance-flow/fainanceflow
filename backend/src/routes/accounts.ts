import { Router } from "express";
import { z } from "zod";
import { AccountType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import { notFound, badRequest } from "../utils/httpError";
import { redis, dashboardKey } from "../lib/redis";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  bankName: z.string().min(1).max(80),
  accountType: z.nativeEnum(AccountType),
  balance: z.number().nonnegative().default(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().min(1).max(40).optional(),
});

const updateSchema = createSchema.partial();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    res.json({ accounts });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const data = createSchema.parse(req.body);
    const account = await prisma.bankAccount.create({
      data: {
        userId,
        bankName: data.bankName,
        accountType: data.accountType,
        balance: new Prisma.Decimal(data.balance),
        color: data.color ?? "#C9A961",
        icon: data.icon ?? "wallet",
      },
    });
    await redis.del(dashboardKey(userId));
    res.status(201).json({ account });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const owned = await prisma.bankAccount.findFirst({ where: { id, userId } });
    if (!owned) throw notFound("Account not found");

    const data = updateSchema.parse(req.body);
    const account = await prisma.bankAccount.update({
      where: { id },
      data: {
        ...(data.bankName !== undefined && { bankName: data.bankName }),
        ...(data.accountType !== undefined && { accountType: data.accountType }),
        ...(data.balance !== undefined && { balance: new Prisma.Decimal(data.balance) }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
      },
    });
    await redis.del(dashboardKey(userId));
    res.json({ account });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const owned = await prisma.bankAccount.findFirst({ where: { id, userId } });
    if (!owned) throw notFound("Account not found");

    await prisma.bankAccount.delete({ where: { id } });
    await redis.del(dashboardKey(userId));
    res.json({ ok: true });
  })
);

export default router;
