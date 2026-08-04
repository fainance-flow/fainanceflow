import type { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { verifyAccess } from "../utils/jwt";
import { prisma } from "../lib/prisma";
import { forbidden, unauthorized } from "../utils/httpError";
import { asyncHandler } from "../utils/asyncHandler";

export interface AuthedRequest extends Request {
  userId: string;
  userRole?: Role;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(unauthorized("Missing bearer token"));
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAccess(token);
    (req as AuthedRequest).userId = payload.sub;
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}

// Loads the user's role from DB (single query, cheap) and ensures it matches
// one of the allowed roles. Must be used after `requireAuth`.
export function requireRole(...allowed: Role[]) {
  return asyncHandler(async (req, _res, next) => {
    const userId = (req as AuthedRequest).userId;
    if (!userId) return next(unauthorized("Missing bearer token"));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) return next(unauthorized("User not found"));
    if (!allowed.includes(user.role)) {
      return next(forbidden(`Requires role: ${allowed.join(" | ")}`));
    }
    (req as AuthedRequest).userRole = user.role;
    next();
  });
}
