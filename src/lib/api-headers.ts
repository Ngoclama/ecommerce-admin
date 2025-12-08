import { NextResponse } from "next/server";

/**
 * Standard cache headers để disable cache ở production
 * Đảm bảo API responses luôn fresh, không bị cache bởi CDN/browser
 */
export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/**
 * Helper để tạo NextResponse với no-cache headers
 */
export function jsonWithNoCache(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...NO_CACHE_HEADERS,
      ...init?.headers,
    },
  });
}
