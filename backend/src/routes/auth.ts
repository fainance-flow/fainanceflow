import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  redis,
  REFRESH_TOKEN_TTL_SECONDS,
  RESET_TOKEN_TTL_SECONDS,
  refreshKey,
  resetKey,
} from "../lib/redis";
import { signAccess, signRefresh, verifyRefresh } from "../utils/jwt";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest, conflict, unauthorized } from "../utils/httpError";
import { requireAuth, type AuthedRequest } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  currency: z.string().length(3).optional(),
  role: z.nativeEnum(Role).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(6).max(128),
});

async function issueTokens(userId: string) {
  const accessToken = signAccess(userId);
  const { token: refreshToken, jti } = signRefresh(userId);
  await redis.set(refreshKey(userId, jti), "1", "EX", REFRESH_TOKEN_TTL_SECONDS);
  return { accessToken, refreshToken };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw conflict("Email already registered");

    // First user in the system becomes admin (bootstrap). After that, public
    // signup always creates a regular user — clients cannot self-promote.
    const userCount = await prisma.user.count();
    const role: Role = userCount === 0 ? (data.role ?? Role.admin) : Role.user;

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        currency: data.currency ?? "PKR",
        role,
      },
      select: { id: true, name: true, email: true, currency: true, role: true, createdAt: true },
    });

    const tokens = await issueTokens(user.id);
    res.status(201).json({ user, ...tokens });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw unauthorized("Invalid credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized("Invalid credentials");

    const tokens = await issueTokens(user.id);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        role: user.role,
        createdAt: user.createdAt,
      },
      ...tokens,
    });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    let payload;
    try {
      payload = verifyRefresh(refreshToken);
    } catch {
      throw unauthorized("Invalid refresh token");
    }

    const key = refreshKey(payload.sub, payload.jti);
    const exists = await redis.get(key);
    if (!exists) throw unauthorized("Refresh token revoked or expired");

    // Rotate: drop the old, issue a fresh pair
    await redis.del(key);
    const tokens = await issueTokens(payload.sub);
    res.json(tokens);
  })
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    // Delete all refresh tokens for this user
    const stream = redis.scanStream({ match: `refresh:${userId}:*`, count: 100 });
    const keys: string[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: string[]) => keys.push(...chunk));
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });
    if (keys.length > 0) await redis.del(...keys);
    res.json({ ok: true });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, currency: true, role: true, createdAt: true },
    });
    if (!user) throw badRequest("User not found");
    res.json({ user });
  })
);

// Generate a password-reset token and store it in Redis (1-hour TTL).
// In production you'd email the link; here we return the token directly for dev use.
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Respond identically whether or not the email exists (prevent enumeration).
      res.json({ message: "If that email is registered, a reset token has been issued." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    await redis.set(resetKey(token), user.id, "EX", RESET_TOKEN_TTL_SECONDS);

    res.json({
      message: "Reset token generated. Copy the token and use it on the reset-password screen.",
      resetToken: token,
    });
  })
);

// Verify the reset token, hash the new password, invalidate all sessions.
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    const key = resetKey(token);
    const userId = await redis.get(key);
    if (!userId) throw badRequest("Reset token is invalid or has expired.");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // Consume the reset token so it cannot be reused.
    await redis.del(key);

    // Revoke all active refresh tokens so every session must re-login.
    const stream = redis.scanStream({ match: `refresh:${userId}:*`, count: 100 });
    const keys: string[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: string[]) => keys.push(...chunk));
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });
    if (keys.length > 0) await redis.del(...keys);

    res.json({ message: "Password reset successfully. Please sign in with your new password." });
  })
);

export default router;
