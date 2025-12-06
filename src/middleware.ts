import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const allowedOrigins = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.FRONTEND_STORE_URL,
  "http://localhost:3000",
  "http://localhost:3001",
];

const ADMIN_ALLOWED_EMAILS =
  process.env.ADMIN_ALLOWED_EMAILS?.split(",").map((e) => e.trim()) || [];

const isAdminRoute = createRouteMatcher([
  "/(dashboard)(.*)",
  "/(root)(.*)",
  "/api/stores(.*)",
  "/api/[storeId](.*)",
  "/api/profile(.*)",
  "/api/webhook(.*)",
  "/api/uploadthing(.*)",
  "/api/upload(.*)",
]);

// Routes that should bypass middleware (for file uploads, etc.)
const isUploadRoute = createRouteMatcher([
  "/api/upload(.*)",
  "/api/uploadthing(.*)",
]);

// Routes public API (không cần check role)
// Lưu ý: /api/orders/user và /api/orders/link-user được gọi từ store proxy
// Store đã authenticate rồi, chỉ cần trust query param clerkUserId
const isPublicApiRoute = createRouteMatcher([
  "/api/wishlist(.*)",
  "/api/products(.*)",
  "/api/categories(.*)",
  "/api/billboards(.*)",
  "/api/colors(.*)",
  "/api/sizes(.*)",
  "/api/materials(.*)",
  "/api/user/role(.*)",
  "/api/orders/user(.*)", // Store proxy đã authenticate
  "/api/orders/link-user(.*)", // Store proxy đã authenticate
]);

export default clerkMiddleware(async (auth, request) => {
  // Upload routes need special handling - bypass middleware completely
  // They handle authentication internally and may have large payloads
  // Edge Runtime has limitations with FormData/file uploads, so we skip middleware for uploads
  // This prevents "Failed to run middleware" errors on Vercel
  if (isUploadRoute(request)) {
    // For upload routes, just pass through without any processing
    // The route handlers will handle authentication and file processing
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const response = NextResponse.next();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  response.headers.set("Access-Control-Allow-Credentials", "true");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  if (isPublicApiRoute(request)) {
    return response;
  }

  if (isAdminRoute(request)) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return response;
      }

      // Chỉ kiểm tra email từ Clerk (không dùng Prisma trong Edge Runtime)
      // Việc kiểm tra role chi tiết sẽ được thực hiện trong route handlers (Node.js runtime)
      if (
        ADMIN_ALLOWED_EMAILS.length > 0 &&
        !ADMIN_ALLOWED_EMAILS.includes("*")
      ) {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

        if (!userEmail || !ADMIN_ALLOWED_EMAILS.includes(userEmail)) {
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
      }
    } catch (error) {
      console.error("[MIDDLEWARE] Error checking email:", error);
      // Không block request nếu có lỗi, để route handlers xử lý
    }
  }

  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/upload (excluded - handled separately, may have large payloads)
     * - api/uploadthing (excluded - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next|api/upload|api/uploadthing|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    /*
     * Match API routes but exclude upload routes explicitly
     * Upload routes are handled separately to avoid Edge Runtime limitations with FormData
     */
    "/(api|trpc)(?!/(upload|uploadthing))(.*)",
  ],
};
