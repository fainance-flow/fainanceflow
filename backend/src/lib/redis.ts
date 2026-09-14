import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
  // Back off on reconnect; cap retries so we don't flood the console
  retryStrategy(times) {
    if (times > 10) return null; // stop retrying
    return Math.min(times * 200, 2000);
  },
});

let lastErrorMessage = "";
redis.on("error", (err) => {
  if (err.message !== lastErrorMessage) {
    lastErrorMessage = err.message;
    console.error("[redis] error:", err.message);
  }
});

redis.on("connect", () => {
  lastErrorMessage = "";
  console.log("[redis] connected");
});

export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days
export const DASHBOARD_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes
export const RESET_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour

export const refreshKey = (userId: string, jti: string) => `refresh:${userId}:${jti}`;
export const dashboardKey = (userId: string) => `dashboard:summary:${userId}`;
export const resetKey = (token: string) => `pwreset:${token}`;

// Redis is optional at runtime (e.g. no Redis add-on on Render). These wrappers
// let callers degrade gracefully — cache misses / best-effort writes — instead of
// throwing and 500ing every request once the connection is exhausted.
export const isRedisReady = () => redis.status === "ready";

export async function safeGet(key: string): Promise<string | null> {
  if (!isRedisReady()) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    console.error("[redis] get failed:", (err as Error).message);
    return null;
  }
}

export async function safeSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!isRedisReady()) return;
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch (err) {
    console.error("[redis] set failed:", (err as Error).message);
  }
}

export async function safeDel(...keys: string[]): Promise<void> {
  if (!isRedisReady() || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.error("[redis] del failed:", (err as Error).message);
  }
}

export async function safeScanKeys(pattern: string): Promise<string[]> {
  if (!isRedisReady()) return [];
  try {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    const keys: string[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: string[]) => keys.push(...chunk));
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });
    return keys;
  } catch (err) {
    console.error("[redis] scan failed:", (err as Error).message);
    return [];
  }
}
