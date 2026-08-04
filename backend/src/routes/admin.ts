import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { badRequest, notFound } from "../utils/httpError";

const router = Router();

// Every admin route requires an authenticated admin
router.use(requireAuth, requireRole(Role.admin));

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        role: true,
        createdAt: true,
      },
    });
    res.json({ users });
  })
);

const roleUpdateSchema = z.object({
  role: z.nativeEnum(Role),
});

router.patch(
  "/users/:id/role",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const { role } = roleUpdateSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw notFound("User not found");

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ user });
  })
);

router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) throw badRequest("Missing id");

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw notFound("User not found");

    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  })
);

export default router;
