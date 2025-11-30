import { auth } from "@clerk/nextjs/server";
import { verifyToken, createClerkClient } from "@clerk/backend";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper function để lấy Clerk userId từ token hoặc cookies
async function getClerkUserId(
  req: Request
): Promise<{ userId: string; isStoreUser: boolean } | null> {
  // Thử lấy từ cookies trước (cho admin)
  try {
    const { userId } = await auth();
    if (userId) {
      return { userId, isStoreUser: false };
    }
  } catch (error) {
    // Ignore error, thử token
  }

  // Thử lấy từ Authorization header (cho store)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      // Thử với Store Clerk instance trước
      if (process.env.CLERK_STORE_SECRET_KEY) {
        try {
          const session = await verifyToken(token, {
            secretKey: process.env.CLERK_STORE_SECRET_KEY!,
          });
          return { userId: session.sub ?? "", isStoreUser: true };
        } catch (storeErr) {
          // Nếu fail, thử với Admin Clerk instance
          const session = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY!,
          });
          return { userId: session.sub ?? "", isStoreUser: false };
        }
      } else {
        // Chỉ có Admin Clerk instance
        const session = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!,
        });
        return { userId: session.sub ?? "", isStoreUser: false };
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.log("[REVIEWS] Token verify failed:", error);
      }
      return null;
    }
  }

  return null;
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    
    if (process.env.NODE_ENV === "development") {
      console.log("[REVIEW_POST] Starting review creation for storeId:", storeId);
    }

    const clerkAuth = await getClerkUserId(req);
    const clerkUserId = clerkAuth?.userId || null;
    const isStoreUser = clerkAuth?.isStoreUser || false;

    if (process.env.NODE_ENV === "development") {
      console.log("[REVIEW_POST] Clerk userId:", clerkUserId);
      console.log("[REVIEW_POST] Is store user:", isStoreUser);
    }

    if (!clerkUserId) {
      if (process.env.NODE_ENV === "development") {
        console.error("[REVIEW_POST] No clerk userId found");
      }
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const body = await req.json();
    const { productId, rating, content, imageUrls } = body;

    if (process.env.NODE_ENV === "development") {
      console.log("[REVIEW_POST] Request body:", { productId, rating, hasContent: !!content });
    }

    if (!rating) {
      return new NextResponse("Rating is required", { status: 400 });
    }

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    // Tìm User Mongo ID từ Clerk ID
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[REVIEW_POST] User found:", user ? user.id : "Not found");
    }

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
            "[REVIEWS] Could not fetch user from Clerk:",
            clerkError
          );
        }

        if (process.env.NODE_ENV === "development") {
          console.log("[REVIEW_POST] Creating user with:", { realEmail, realName });
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

        if (process.env.NODE_ENV === "development") {
          console.log("[REVIEW_POST] User created:", user.id);
        }
      } catch (createError: any) {
        if (createError.code === "P2002") {
          user = await prisma.user.findUnique({
            where: { clerkId: clerkUserId },
          });
        }

        if (!user) {
          console.error("[REVIEWS_USER_CREATE_ERROR]", createError);
          return new NextResponse(
            `Failed to create user account: ${createError.message}`,
            { status: 500 }
          );
        }
      }
    }

    // Kiểm tra user đã mua sản phẩm chưa
    if (process.env.NODE_ENV === "development") {
      console.log("[REVIEW_POST] Checking purchase for userId:", user.id, "productId:", productId);
    }

    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: user.id, // Sử dụng database user ID
        isPaid: true,
        orderItems: {
          some: {
            productId: productId,
          },
        },
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[REVIEW_POST] Has purchased:", !!hasPurchased);
    }

    // Tạm thời bỏ qua kiểm tra đã mua để test (có thể bật lại sau)
    // if (!hasPurchased) {
    //   return new NextResponse(
    //     "Bạn phải mua sản phẩm này trước khi đánh giá.",
    //     { status: 403 }
    //   );
    // }

    // Tạo review
    if (process.env.NODE_ENV === "development") {
      console.log("[REVIEW_POST] Creating review with:", {
        userId: user.id,
        productId,
        rating,
        hasContent: !!content,
      });
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id, // Sử dụng database user ID
        productId,
        rating,
        content: content || null,
        imageUrls: imageUrls || [],
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[REVIEW_POST] Review created successfully:", review.id);
    }

    return NextResponse.json(review);
  } catch (error: any) {
    console.error("[REVIEW_POST] Error:", error);
    console.error("[REVIEW_POST] Error message:", error.message);
    console.error("[REVIEW_POST] Error stack:", error.stack);
    return new NextResponse(
      `Internal Server Error: ${error.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    let reviews;

    if (productId) {
      // Lấy reviews cho một product cụ thể (public endpoint)
      reviews = await prisma.review.findMany({
        where: {
          productId: productId,
          isArchived: false, // Chỉ lấy reviews chưa bị ẩn
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Lấy tất cả reviews của store (admin endpoint)
      const products = await prisma.product.findMany({
        where: { storeId },
        select: { id: true },
      });

      const productIds = products.map((p) => p.id);

      reviews = await prisma.review.findMany({
        where: {
          productId: { in: productIds },
        },
        include: {
          user: true,
          product: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("[REVIEW_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const clerkAuth = await getClerkUserId(req);
    const clerkUserId = clerkAuth?.userId || null;

    if (!clerkUserId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Tìm user trong database
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Kiểm tra user có quyền xóa reviews (phải là owner của store)
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId: user.id },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Check if request body has specific IDs to delete
    let body: any = {};
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 0) {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const idsToDelete = body.ids;

    let reviewIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific reviews by IDs
      // Verify reviews belong to products in this store
      const products = await prisma.product.findMany({
        where: { storeId },
        select: { id: true },
      });

      const productIds = products.map((p) => p.id);

      const reviewsToDelete = await prisma.review.findMany({
        where: {
          id: { in: idsToDelete },
          productId: { in: productIds },
        },
        select: { id: true },
      });

      reviewIds = reviewsToDelete.map((r) => r.id);

      if (reviewIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid reviews found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all reviews (original behavior)
      const products = await prisma.product.findMany({
        where: { storeId },
        select: { id: true },
      });

      const productIds = products.map((p) => p.id);

      const reviewsToDelete = await prisma.review.findMany({
        where: {
          productId: { in: productIds },
        },
        select: { id: true },
      });

      reviewIds = reviewsToDelete.map((r) => r.id);
    }

    const result = await prisma.review.deleteMany({
      where: {
        id: { in: reviewIds },
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${result.count} reviews.`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("[REVIEWS_DELETE_ALL_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
