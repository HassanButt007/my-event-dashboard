const cache = new Map<string, { data: any; timestamp: number }>();

const TTL_MS = 60 * 1000; // 1 minute

export function getCache(key: string) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

export function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}
