import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { verifyToken, createClerkClient } from "@clerk/backend";
import prisma from "@/lib/prisma";

// Helper function to get CORS headers based on request origin
const getCorsHeaders = (req: Request) => {
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
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
};

async function getClerkUserId(
  req: Request
): Promise<{ userId: string; isStoreUser: boolean } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);

  // Thử verify với Admin Clerk instance trước
  try {
    const session = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return { userId: session.sub ?? "", isStoreUser: false };
  } catch (adminErr) {
    // Nếu fail với Admin, thử với Store Clerk instance
    if (process.env.CLERK_STORE_SECRET_KEY) {
      try {
        const session = await verifyToken(token, {
          secretKey: process.env.CLERK_STORE_SECRET_KEY!,
        });
        return { userId: session.sub ?? "", isStoreUser: true };
      } catch (storeErr) {
        if (process.env.NODE_ENV === "development") {
          console.log("[WISHLIST] Token verify failed for both instances");
        }
        return null;
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[WISHLIST] Admin verify failed, no CLERK_STORE_SECRET_KEY"
        );
      }
      return null;
    }
  }
}

// Helper function để lấy user từ Clerk (thử cả 2 instances)
async function getClerkUser(clerkUserId: string, isStoreUser: boolean) {
  try {
    if (isStoreUser && process.env.CLERK_STORE_SECRET_KEY) {
      // Sử dụng Store Clerk client
      const storeClerk = createClerkClient({
        secretKey: process.env.CLERK_STORE_SECRET_KEY,
      });
      return await storeClerk.users.getUser(clerkUserId);
    } else {
      // Sử dụng Admin Clerk client (default)
      const clerk = await clerkClient();
      return await clerk.users.getUser(clerkUserId);
    }
  } catch (error) {
    // Nếu fail với instance đầu tiên, thử instance còn lại
    if (isStoreUser) {
      try {
        const clerk = await clerkClient();
        return await clerk.users.getUser(clerkUserId);
      } catch {
        return null;
      }
    } else if (process.env.CLERK_STORE_SECRET_KEY) {
      try {
        const storeClerk = createClerkClient({
          secretKey: process.env.CLERK_STORE_SECRET_KEY,
        });
        return await storeClerk.users.getUser(clerkUserId);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      const corsHeaders = getCorsHeaders(req);
      return new NextResponse(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const corsHeaders = getCorsHeaders(req);
    const headers = req.headers;
    const cookieHeader = headers.get("cookie");
    const authHeader = headers.get("authorization");

    if (process.env.NODE_ENV === "development") {
      console.log(
        "[WISHLIST_POST] Cookie header:",
        cookieHeader ? "Present" : "Missing"
      );
      console.log(
        "[WISHLIST_POST] Authorization header:",
        authHeader ? "Present" : "Missing"
      );
    }

    const clerkAuth = await getClerkUserId(req);
    const clerkUserId = clerkAuth?.userId || null;
    const isStoreUser = clerkAuth?.isStoreUser || false;

    if (process.env.NODE_ENV === "development") {
      console.log("[WISHLIST_POST] Clerk User ID:", clerkUserId || "Not found");
      console.log("[WISHLIST_POST] Is Store User:", isStoreUser);
      console.log("[WISHLIST_POST] Cookie header present:", !!cookieHeader);
      console.log(
        "[WISHLIST_POST] Authorization header present:",
        !!authHeader
      );
      if (cookieHeader) {
        console.log(
          "[WISHLIST_POST] Cookie preview:",
          cookieHeader.substring(0, 200)
        );
      }
    }

    const body = await req.json();
    const { productId, action } = body;

    if (!clerkUserId) {
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[WISHLIST_POST] No Clerk user ID found. Cookies:",
          cookieHeader?.substring(0, 100)
        );
      }
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please sign in" },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Tìm User Mongo ID từ Clerk ID
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      try {
        let realEmail = `user_${clerkUserId}@temp.com`;
        let realName = "User";
        let realImageUrl: string | null = null;

        try {
          const clerkUser = await getClerkUser(clerkUserId, isStoreUser);
          if (clerkUser && clerkUser.emailAddresses.length > 0) {
            realEmail = clerkUser.emailAddresses[0].emailAddress;
            realName =
              clerkUser.firstName && clerkUser.lastName
                ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
                : clerkUser.firstName || clerkUser.lastName || "User";
            realImageUrl = clerkUser.imageUrl || null;
          }
        } catch (clerkError) {
          console.warn(
            "[WISHLIST] Could not fetch user from Clerk:",
            clerkError
          );
        }

        user = await prisma.user.create({
          data: {
            clerkId: clerkUserId,
            email: realEmail,
            name: realName,
            imageUrl: realImageUrl,
            role: "CUSTOMER",
          },
        });
      } catch (createError: any) {
        if (createError.code === "P2002") {
          user = await prisma.user.findUnique({
            where: { clerkId: clerkUserId },
          });
        }

        if (!user) {
          console.error("[WISHLIST_USER_CREATE_ERROR]", createError);
          return NextResponse.json(
            { success: false, message: "Failed to create user account" },
            { status: 500, headers: corsHeaders }
          );
        }
      }
    } else {
      if (user.email.includes("@temp.com")) {
        try {
          const clerkUser = await getClerkUser(clerkUserId, isStoreUser);
          if (clerkUser && clerkUser.emailAddresses.length > 0) {
            const realEmail = clerkUser.emailAddresses[0].emailAddress;
            const realName =
              clerkUser.firstName && clerkUser.lastName
                ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
                : clerkUser.firstName || clerkUser.lastName || user.name;

            await prisma.user.update({
              where: { id: user.id },
              data: {
                email: realEmail,
                name: realName || user.name,
                imageUrl: clerkUser.imageUrl || user.imageUrl,
              },
            });

            const refreshedUser = await prisma.user.findUnique({
              where: { id: user.id },
            });
            if (refreshedUser) {
              user = refreshedUser;
            }
          }
        } catch (syncError) {
          console.warn(
            "[WISHLIST] Could not sync email from Clerk:",
            syncError
          );
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Kiểm tra xem item đã có trong wishlist chưa
    const existingWishlist = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    // Nếu action là "toggle", kiểm tra trạng thái hiện tại và đảo ngược
    if (action === "toggle") {
      if (existingWishlist) {
        // Đã có trong wishlist -> Xóa
        await prisma.wishlist.delete({
          where: { id: existingWishlist.id },
        });
        return NextResponse.json(
          {
            success: true,
            isLiked: false,
            message: "Removed from wishlist",
          },
          { headers: corsHeaders }
        );
      } else {
        // Chưa có trong wishlist -> Thêm
        await prisma.wishlist.create({
          data: {
            userId: user.id,
            productId,
          },
        });
        return NextResponse.json(
          {
            success: true,
            isLiked: true,
            message: "Added to wishlist",
          },
          { headers: corsHeaders }
        );
      }
    }

    // Xử lý các action khác (add, remove)
    const shouldAdd = action !== "remove";

    if (shouldAdd) {
      if (existingWishlist) {
        return NextResponse.json(
          {
            success: true,
            isLiked: true,
            message: "Product already in wishlist",
          },
          { headers: corsHeaders }
        );
      }

      await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId,
        },
      });

      return NextResponse.json(
        {
          success: true,
          isLiked: true,
          message: "Added to wishlist",
        },
        { headers: corsHeaders }
      );
    } else {
      if (existingWishlist) {
        await prisma.wishlist.delete({
          where: { id: existingWishlist.id },
        });
      }

      return NextResponse.json(
        {
          success: true,
          isLiked: false,
          message: "Removed from wishlist",
        },
        { headers: corsHeaders }
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[WISHLIST_PUBLIC_POST]", error);
    }
    const corsHeaders = getCorsHeaders(req);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      const corsHeaders = getCorsHeaders(req);
      return new NextResponse(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const corsHeaders = getCorsHeaders(req);
    const clerkAuth = await getClerkUserId(req);
    const clerkUserId = clerkAuth?.userId || null;
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: user.id },
      select: {
        productId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      distinct: ["productId"], // Ensure unique productIds
    });

    // Additional safety: Remove any remaining duplicates
    const uniqueProductIds = Array.from(
      new Set(wishlist.map((item) => item.productId))
    );

    return NextResponse.json(
      {
        success: true,
        data: uniqueProductIds,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[WISHLIST_PUBLIC_GET]", error);
    }
    const corsHeaders = getCorsHeaders(req);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
