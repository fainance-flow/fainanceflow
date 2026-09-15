import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_SECRET ?? "dev-access";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh";

export interface AccessPayload {
  sub: string; // userId
}

export interface RefreshPayload {
  sub: string;
  jti: string;
}

export function signAccess(userId: string): string {
  const opts: SignOptions = { expiresIn: "15m" };
  return jwt.sign({ sub: userId } satisfies AccessPayload, ACCESS_SECRET, opts);
}

export function signRefresh(userId: string): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const opts: SignOptions = { expiresIn: "30d" };
  const token = jwt.sign({ sub: userId, jti } satisfies RefreshPayload, REFRESH_SECRET, opts);
  return { token, jti };
}

export function verifyAccess(token: string): AccessPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}

export function verifyRefresh(token: string): RefreshPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshPayload;
}
