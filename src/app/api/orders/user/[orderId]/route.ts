import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserFromDb } from "@/lib/permissions";
import { userService } from "@/lib/services/user.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return new NextResponse("Order ID is required", { status: 400 });
    }

    // Try to get userId from query params first (from store server proxy)
    const { searchParams } = new URL(req.url);
    const clerkUserIdFromQuery = searchParams.get("clerkUserId");

    // Also try to get from auth (direct call - may not work if cookies aren't forwarded)
    const { userId: clerkUserIdFromAuth } = await auth();

    // Ưu tiên query param từ store proxy
    const clerkUserId = clerkUserIdFromQuery || clerkUserIdFromAuth;

    if (!clerkUserId) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthenticated",
          message: "User ID is required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get or create user using UserService (with auto-sync)
    const user = await userService.getOrCreateUser(clerkUserId, false, true);

    if (!user) {
      return new NextResponse(
        JSON.stringify({
          error: "User not found",
          message: "Could not find or create user",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Auto-link orders by email
    if (user.email) {
      await userService.linkOrdersByEmail(user.id, user.email);
    }

    // Get latest email from Clerk for comparison (may be newer than DB)
    let clerkEmail: string | null = null;
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(clerkUserId);
      clerkEmail = clerkUser.emailAddresses[0]?.emailAddress || null;
    } catch (clerkError) {
      console.warn("[ORDER_DETAIL] Could not fetch Clerk user:", clerkError);
    }

    // Lấy order
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        storeId: true,
        userId: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        phone: true,
        address: true,
        email: true,
        receiverName: true,
        receiverPhone: true,
        shippingAddress: true,
        city: true,
        postalCode: true,
        country: true,
        total: true,
        subtotal: true,
        tax: true,
        discount: true,
        shippingCost: true,
        isPaid: true,
        status: true,
        shippingMethod: true,
        trackingNumber: true,
        paymentMethod: true,
        paymentStatus: true,
        transactionId: true,
        couponCode: true,
        customerNote: true,
        createdAt: true,
        updatedAt: true,
        orderItems: {
          select: {
            id: true,
            productName: true,
            productPrice: true,
            quantity: true,
            price: true,
            imageUrl: true,
            sizeName: true,
            colorName: true,
            materialName: true,
            product: {
              select: {
                id: true,
                name: true,
                images: {
                  select: {
                    url: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Kiểm tra quyền truy cập:
    // 1. Order thuộc về user (userId khớp)
    // 2. HOẶC email của order khớp với email của user (case-insensitive, normalized)

    // Normalize emails for comparison
    const normalizeEmail = (
      email: string | null | undefined
    ): string | null => {
      if (!email) return null;
      return email.toLowerCase().trim().replace(/\s+/g, "");
    };

    const orderEmailNormalized = normalizeEmail(order.email);
    const userEmailNormalized = normalizeEmail(user.email);
    const clerkEmailNormalized = normalizeEmail(clerkEmail);

    // Check access: userId match OR email match (from DB or Clerk)
    const hasAccess =
      order.userId === user.id ||
      (orderEmailNormalized &&
        ((userEmailNormalized &&
          orderEmailNormalized === userEmailNormalized) ||
          (clerkEmailNormalized &&
            orderEmailNormalized === clerkEmailNormalized)));

    // Log for debugging
    if (!hasAccess) {
      console.log("[ORDER_DETAIL] Access denied:", {
        orderId,
        orderUserId: order.userId,
        userDbId: user.id,
        orderEmail: order.email,
        orderEmailNormalized,
        userEmail: user.email,
        userEmailNormalized,
        clerkEmail: clerkEmail,
        clerkEmailNormalized,
        userIdMatch: order.userId === user.id,
        emailMatchDb: orderEmailNormalized === userEmailNormalized,
        emailMatchClerk: orderEmailNormalized === clerkEmailNormalized,
      });
    }

    if (!hasAccess) {
      return new NextResponse(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to view this order",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Nếu order chưa được link với user, tự động link
    if (!order.userId && user.id) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { userId: user.id },
        });
        console.log(
          `[ORDER_DETAIL] Auto-linked order ${orderId} to user ${user.id}`
        );
      } catch (linkError) {
        console.error("[ORDER_DETAIL] Error auto-linking order:", linkError);
        // Không fail request nếu link lỗi
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_DETAIL_GET_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
