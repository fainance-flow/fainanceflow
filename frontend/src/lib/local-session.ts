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
