const cache = new Map<string, any>();

export function getCache(key: string) {
  return cache.get(key);
}

export function setCache(key: string, value: any) {
  cache.set(key, value);
}

export function clearCache() {
  console.log("Clearing event cache...");
  cache.clear();
}