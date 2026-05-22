import { config } from "../config";

let useInMemory = true;
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

let redisModule: typeof import("ioredis") | null = null;
let redis: InstanceType<typeof import("ioredis").default> | null = null;

export async function initRedis(): Promise<void> {
  try {
    redisModule = await import("ioredis");
    const Redis = redisModule.default;
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy(times) {
        if (times > 1) return null;
        return 500;
      },
    });

    redis.on("error", () => {});

    await redis.connect();
    await redis.ping();
    useInMemory = false;
    console.log("Connected to Redis");
  } catch {
    useInMemory = true;
    redis = null;
    console.log("Redis unavailable — using in-memory cache");
  }
}

export function getRedisConnection() {
  return redis;
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds = 3600
): Promise<void> {
  if (useInMemory || !redis) {
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return;
  }
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch {
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  if (useInMemory || !redis) {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function cacheDelete(key: string): Promise<void> {
  if (useInMemory || !redis) {
    memoryCache.delete(key);
    return;
  }
  try {
    await redis.del(key);
  } catch {
    memoryCache.delete(key);
  }
}

export function isRedisAvailable(): boolean {
  return !useInMemory && redis !== null;
}
