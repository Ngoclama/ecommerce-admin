import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserFromDb } from "@/lib/permissions";

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

    // Lấy user từ database
    let user = await getUserFromDb(clerkUserId);

    if (!user) {
      // Try to create user from Clerk
      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(clerkUserId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        const name =
          clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
            : clerkUser.firstName || clerkUser.lastName || "User";

        user = await prisma.user.create({
          data: {
            clerkId: clerkUserId,
            email: email || `user_${clerkUserId}@temp.com`,
            name: name,
            role: "CUSTOMER",
          },
        });
      } catch (createError: any) {
        if (createError.code === "P2002") {
          // User already exists, try to fetch again
          user = await getUserFromDb(clerkUserId);
        }
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
      }
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
    // 2. HOẶC email của order khớp với email của user (case-insensitive)
    const hasAccess =
      order.userId === user.id ||
      (order.email &&
        user.email &&
        order.email.toLowerCase().trim() === user.email.toLowerCase().trim());

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
        console.log(`[ORDER_DETAIL] Auto-linked order ${orderId} to user ${user.id}`);
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

