import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdmin, getUserFromDb } from "@/lib/permissions";

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
]);

// Routes public API (không cần check role)
const isPublicApiRoute = createRouteMatcher([
  "/api/wishlist(.*)",
  "/api/products(.*)",
  "/api/categories(.*)",
  "/api/billboards(.*)",
  "/api/colors(.*)",
  "/api/sizes(.*)",
  "/api/materials(.*)",
  "/api/user/role(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
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
  response.headers.set("Access-Control-Allow-Credentials", "true");

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: response.headers });
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

      const user = await getUserFromDb(userId);

      if (user) {
        if (user.role !== "ADMIN") {
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        if (user.isBanned) {
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
      } else {
        if (
          ADMIN_ALLOWED_EMAILS.length === 0 ||
          ADMIN_ALLOWED_EMAILS.includes("*")
        ) {
          return response;
        }

        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

        if (!userEmail || !ADMIN_ALLOWED_EMAILS.includes(userEmail)) {
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
      }
    } catch (error) {
      console.error("[MIDDLEWARE] Error checking role:", error);
    }
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
