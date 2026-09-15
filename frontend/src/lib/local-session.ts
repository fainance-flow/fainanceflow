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

const CACHED_USER_KEY = "ff-cached-user";

/** Last known-good user, so a cold reload while offline can't verify /auth/me but can still trust who was logged in. */
export function cacheUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
}

export function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CACHED_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearCachedUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHED_USER_KEY);
}
