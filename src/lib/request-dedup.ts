/**
 * Request Deduplication Utility
 * Prevents duplicate requests for same data
 */

type PendingRequest<T> = {
  promise: Promise<T>;
  timestamp: number;
};

const pendingRequests = new Map<string, PendingRequest<any>>();

const REQUEST_DEDUP_TIMEOUT = 5000; // 5 seconds

/**
 * Execute request with deduplication
 * If same request is made within timeout, reuse pending promise
 */
export async function deduplicateRequest<T>(
  key: string,
  requester: () => Promise<T>
): Promise<T> {
  const existing = pendingRequests.get(key);

  if (existing && Date.now() - existing.timestamp < REQUEST_DEDUP_TIMEOUT) {
    return existing.promise;
  }

  const promise = requester().finally(() => {
    setTimeout(() => {
      pendingRequests.delete(key);
    }, REQUEST_DEDUP_TIMEOUT);
  });

  pendingRequests.set(key, { promise, timestamp: Date.now() });

  return promise;
}

/**
 * Batch multiple requests to avoid N+1
 */
export async function batchRequests<T, K>(
  items: T[],
  keyExtractor: (item: T) => string,
  fetcher: (ids: string[]) => Promise<K[]>
): Promise<K[]> {
  if (!items.length) return [];

  const ids = items.map(keyExtractor);
  const uniqueIds = [...new Set(ids)];

  return fetcher(uniqueIds);
}

/**
 * Clear all pending requests
 */
export function clearPendingRequests() {
  pendingRequests.clear();
}
