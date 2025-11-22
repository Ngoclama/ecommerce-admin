import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Danh sách các domain được phép gọi API của bạn
const allowedOrigins = [
  process.env.NEXT_PUBLIC_API_URL, // URL trang Admin
  process.env.FRONTEND_STORE_URL, // URL trang Bán hàng (Store)
  "http://localhost:3000", // Dev environment
  "http://localhost:3001",
];

export default clerkMiddleware((auth, request) => {
  const origin = request.headers.get("origin");
  const response = NextResponse.next();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/api/uploadthing",
  ],
};
