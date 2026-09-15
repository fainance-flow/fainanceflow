import { clearOfflineCache, readOfflineCache, writeOfflineCache } from "@lib/offline-read-cache";
import type { User } from "@utils/types";

export const LOCAL_SESSION_KEY = "ff-local-session";

export const LOCAL_OFFLINE_USER: User = {
  id: "local-offline",
  name: "Local user",
  email: "offline@financeflow.local",
  currency: "PKR",
  role: "user",
  createdAt: new Date().toISOString(),
};

export function isLocalSession(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOCAL_SESSION_KEY) === "1";
}

export function setLocalSession(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_SESSION_KEY, "1");
}

export function clearLocalSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_SESSION_KEY);
}

const CACHED_USER_KEY = "cached-user";

/**
 * Last known-good user, so a cold reload while offline (which can't verify /auth/me)
 * can still trust who was logged in. Expires after 30 days, same as the wallets/
 * transactions read cache in offline-read-cache.ts — by then the refresh token itself
 * would also be expired server-side, so there'd be nothing left to sync back to anyway.
 */
export function cacheUser(user: User): void {
  writeOfflineCache(CACHED_USER_KEY, user);
}

export function getCachedUser(): User | null {
  return readOfflineCache<User>(CACHED_USER_KEY) ?? null;
}

export function clearCachedUser(): void {
  clearOfflineCache(CACHED_USER_KEY);
}
