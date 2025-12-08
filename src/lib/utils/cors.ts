import { NextRequest } from "next/server";

export function getCorsHeaders(
  req: NextRequest | Request
): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    process.env.FRONTEND_STORE_URL,
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", ""),
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter(Boolean) as string[];

  let allowedOrigin: string;

  if (origin) {
    const matchedOrigin = allowedOrigins.find(
      (url) => origin === url || origin.startsWith(url)
    );
    allowedOrigin = matchedOrigin || origin; // Use origin if it's provided
  } else {
    allowedOrigin = allowedOrigins[0] || "http://localhost:3000";
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Cache-Control",
    "Access-Control-Allow-Credentials": "true",
  };
}

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
