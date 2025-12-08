

const cache = new Map<string, { data: any; timestamp: number }>();

const CACHE_DURATIONS = {
  PRODUCTS: 5 * 60 * 1000, 
  CATEGORIES: 10 * 60 * 1000, 
  ORDERS: 1 * 60 * 1000, 
  BILLBOARDS: 15 * 60 * 1000, 
  SETTINGS: 30 * 60 * 1000, 
} as const;

export function getCacheKey(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}

export function setCache(
  key: string,
  data: any,
  duration: number = 5 * 60 * 1000
) {
  cache.set(key, {
    data,
    timestamp: Date.now() + duration,
  });
}

export function getCache(key: string): any | null {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() > item.timestamp) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

export function clearCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  duration: number = 5 * 60 * 1000
): Promise<T> {
  const cached = getCache(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();

  setCache(key, data, duration);

  return data;
}

export function invalidateProductCache(storeId: string) {
  clearCache(`products:${storeId}`);
  clearCache(`featured-products:${storeId}`);
}

export function invalidateCategoryCache(storeId: string) {
  clearCache(`categories:${storeId}`);
}

export function invalidateOrderCache(storeId: string) {
  clearCache(`orders:${storeId}`);
}
