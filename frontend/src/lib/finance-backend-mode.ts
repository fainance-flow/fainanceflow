import { tokenStore } from "@libs/axios";
import { isLocalSession } from "@/lib/local-session";

/** True when the signed-in user should load/save finance data via the API (PostgreSQL). */
export function shouldUseCloudFinance(): boolean {
  if (typeof window === "undefined") return false;
  if (isLocalSession()) return false;
  return Boolean(tokenStore.getAccess());
}
