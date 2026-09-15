const PREFIX = "ff:offline-cache:";

/** Last-known-good snapshot of a GET response, read back when offline with nothing fresher. */
export function writeOfflineCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full/unavailable — best effort only, never block the real fetch on this
  }
}

export function readOfflineCache<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}
