import { NextRequest } from "next/server";

/**
 * CORS Utility
 * Centralized CORS header management
 */

/**
 * Get CORS headers based on request origin
 * Supports multiple allowed origins for cross-origin requests
 */
export function getCorsHeaders(req: NextRequest | Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    process.env.FRONTEND_STORE_URL,
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", ""),
    "https://ecommerce-store-henna-nine.vercel.app", // Store production URL
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter(Boolean) as string[];

  // When using credentials, we MUST use a specific origin, not wildcard
  // If origin matches any allowed origin, use it
  // Otherwise, use the store URL from env (never use wildcard)
  let allowedOrigin: string;

  if (origin) {
    // Check if origin exactly matches or starts with any allowed origin
    const matchedOrigin = allowedOrigins.find(
      (url) => origin === url || origin.startsWith(url)
    );
    allowedOrigin = matchedOrigin || origin; // Use origin if it's provided
  } else {
    // No origin header (e.g., same-origin request), use store URL
    allowedOrigin =
      allowedOrigins[0] || "https://ecommerce-store-henna-nine.vercel.app";
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflight(req: NextRequest | Request) {
  if (req.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(req);
    return new Response(null, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    });
  }
  return null;
}

