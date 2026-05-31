/**
 * Redis client for campaign list caching (GET /campaigns).
 * Errors propagate to the route handler, which logs and falls back to Postgres.
 */
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

let client: Redis | undefined;

function getRedis(): Redis {
  if (!client) {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    client.on("error", () => {
      // Expected when Redis is not running; route falls back to Postgres.
    });
  }
  return client;
}

export const redisClient = {
  async get(key: string): Promise<string | null> {
    return getRedis().get(key);
  },

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await getRedis().setex(key, seconds, value);
  },
};
