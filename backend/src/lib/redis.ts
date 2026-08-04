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
