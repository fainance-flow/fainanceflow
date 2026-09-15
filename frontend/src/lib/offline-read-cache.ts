const PREFIX = "ff:offline-cache:";
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type Envelope<T> = { value: T; savedAt: number };

/**
 * Last-known-good snapshot of a GET response (wallets, transactions, the logged-in
 * user), read back when offline with nothing fresher. Expires after 30 days so a
 * phone that's been offline for a long time doesn't keep trusting very stale data
 * forever — this is a read cache, not the write queue (see offline-queue.ts, which
 * intentionally never expires: a pending expense must survive until it actually syncs).
 */
export function writeOfflineCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: Envelope<T> = { value, savedAt: Date.now() };
    localStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // storage full/unavailable — best effort only, never block the real fetch on this
  }
}

export function readOfflineCache<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const envelope = JSON.parse(raw) as Envelope<T>;
    if (Date.now() - envelope.savedAt > ttlMs) {
      localStorage.removeItem(PREFIX + key);
      return undefined;
    }
    return envelope.value;
  } catch {
    return undefined;
  }
}

export function clearOfflineCache(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + key);
}
