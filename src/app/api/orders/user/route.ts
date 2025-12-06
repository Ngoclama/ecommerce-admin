import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserFromDb } from "@/lib/permissions";
import { userService } from "@/lib/services/user.service";

export async function GET(req: Request) {
  try {
    // Try to get userId from query params first (from store server proxy)
    const { searchParams } = new URL(req.url);
    const clerkUserIdFromQuery = searchParams.get("clerkUserId");

    // Also try to get from auth (direct call - may not work if cookies aren't forwarded)
    // NOTE: Nếu store và admin dùng 2 Clerk keys khác nhau, auth() sẽ không hoạt động
    // Vì cookies từ Clerk instance A không hợp lệ với Clerk instance B
    const { userId: clerkUserIdFromAuth } = await auth();

    // Ưu tiên query param từ store proxy (store đã authenticate rồi)
    // Chỉ dùng auth() nếu không có query param (direct call từ admin)
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

    // Nếu có query param từ store proxy, trust nó hoàn toàn
    // Vì store và admin có thể dùng 2 Clerk keys khác nhau
    // Cookies từ Clerk A không hợp lệ với Clerk B
    if (clerkUserIdFromQuery) {
      // Store đã authenticate rồi, trust query param
      console.log(
        "[USER_ORDERS_GET] Using clerkUserId from query param (store proxy):",
        clerkUserIdFromQuery
      );
    } else if (clerkUserIdFromAuth) {
      // Direct call từ admin (cùng Clerk instance)
      console.log(
        "[USER_ORDERS_GET] Using clerkUserId from auth (direct call):",
        clerkUserIdFromAuth
      );
    } else {
      // Không có cả hai → unauthenticated
    }

    // Get or create user using UserService (with auto-sync)
    const user = await userService.getOrCreateUser(clerkUserId, false, true);

    if (!user) {
      console.warn(
        "[USER_ORDERS_GET] User not found and could not be created:",
        {
          clerkUserId,
          hasQueryParam: !!clerkUserIdFromQuery,
          hasAuth: !!clerkUserIdFromAuth,
        }
      );
      return NextResponse.json([]);
    }

    console.log("[USER_ORDERS_GET] User found:", {
      userId: user.id,
      email: user.email,
      clerkId: user.clerkId,
    });

    // Tự động link orders với user dựa trên email trước khi query
    // Điều này đảm bảo đơn hàng được link ngay cả khi chưa có userId
    if (user.email) {
      try {
        // Normalize email for comparison (lowercase, trim)
        const normalizedEmail = user.email.toLowerCase().trim();

        // MongoDB doesn't support mode: "insensitive", so we need to:
        // 1. Try exact match first
        // 2. Try normalized (lowercase) match
        // 3. Find all orders with userId=null and filter in code (fallback)

        // First, try exact match
        let linkResult = await prisma.order.updateMany({
          where: {
            userId: null,
            email: user.email, // Exact match
          },
          data: {
            userId: user.id,
          },
        });

        if (linkResult.count > 0) {
          console.log(
            `[USER_ORDERS_GET] Auto-linked ${linkResult.count} orders to user based on exact email match: ${user.email}`
          );
        }

        // Then, try normalized (lowercase) match if email is different
        if (user.email !== normalizedEmail) {
          // Find orders with normalized email
          const ordersToLink = await prisma.order.findMany({
            where: {
              userId: null,
              email: normalizedEmail,
            },
            select: {
              id: true,
              email: true,
            },
          });

          if (ordersToLink.length > 0) {
            // Update each order individually
            const linkPromises = ordersToLink.map((order) =>
              prisma.order.update({
                where: { id: order.id },
                data: { userId: user.id },
              })
            );

            await Promise.all(linkPromises);

            console.log(
              `[USER_ORDERS_GET] Auto-linked ${ordersToLink.length} orders to user based on normalized email: ${normalizedEmail}`
            );
            console.log(
              `[USER_ORDERS_GET] Linked order IDs:`,
              ordersToLink.map((o) => o.id)
            );
          }
        }

        // Fallback: Find all orders with userId=null and email matching (case-insensitive in code)
        // This handles cases where email might have different casing in database
        const allUnlinkedOrders = await prisma.order.findMany({
          where: {
            userId: null,
            email: { not: null },
          },
          select: {
            id: true,
            email: true,
          },
          take: 100, // Limit to avoid performance issues
        });

        // Filter orders with matching email (case-insensitive)
        const matchingOrders = allUnlinkedOrders.filter(
          (order) =>
            order.email && order.email.toLowerCase().trim() === normalizedEmail
        );

        if (matchingOrders.length > 0) {
          const linkPromises = matchingOrders.map((order) =>
            prisma.order.update({
              where: { id: order.id },
              data: { userId: user.id },
            })
          );

          await Promise.all(linkPromises);

          console.log(
            `[USER_ORDERS_GET] Auto-linked ${matchingOrders.length} orders via fallback case-insensitive matching`
          );
          console.log(
            `[USER_ORDERS_GET] Linked order IDs:`,
            matchingOrders.map((o) => o.id)
          );
        }
      } catch (linkError) {
        console.error(
          "[USER_ORDERS_GET] Error auto-linking orders:",
          linkError
        );
        // Không throw error, tiếp tục query
      }
    }

    // Lấy storeId từ query params (đã lấy ở trên)
    const storeId = searchParams.get("storeId");

    // Query orders: Đơn giản nhất - tìm theo userId HOẶC email
    // Chỉ cần lấy đơn hàng đã đặt (không cần filter isPaid vì user muốn xem tất cả)
    // MongoDB doesn't support mode: "insensitive", so we query with exact matches
    // and handle case-insensitive matching in the auto-link step above
    const normalizedEmail = user.email ? user.email.toLowerCase().trim() : null;
    const whereClause: any = {
      OR: [
        { userId: user.id }, // Đơn hàng đã link với user
        ...(user.email
          ? [
              { email: user.email }, // Exact match
              ...(normalizedEmail && normalizedEmail !== user.email
                ? [{ email: normalizedEmail }]
                : []), // Normalized match if different
            ]
          : []), // Hoặc có cùng email
      ],
    };

    // Nếu có storeId, thêm điều kiện
    if (storeId) {
      whereClause.storeId = storeId;
    }

    console.log("[USER_ORDERS_GET] Querying with whereClause:", {
      userId: user.id,
      email: user.email,
      storeId: storeId || "all",
      whereClause: JSON.stringify(whereClause, null, 2),
    });

    // Debug: Kiểm tra xem có đơn hàng nào trong database không
    const allOrdersCount = await prisma.order.count();
    const ordersWithUserId = await prisma.order.count({
      where: { userId: user.id },
    });
    const ordersWithEmail = user.email
      ? await prisma.order.count({
          where: { email: user.email },
        })
      : 0;
    const ordersWithQuery = await prisma.order.count({
      where: whereClause,
    });

    console.log("[USER_ORDERS_GET] Debug counts:", {
      totalOrders: allOrdersCount,
      ordersWithUserId,
      ordersWithEmail,
      ordersWithQuery, // Số orders sẽ được query
      userEmail: user.email,
      userId: user.id,
    });

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        storeId: true,
        userId: true, // Thêm userId để có thể check
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
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("[USER_ORDERS_GET] Found orders:", {
      count: orders.length,
      orderIds: orders.map((o) => o.id),
      orderNumbers: orders.map((o) => o.orderNumber),
      ordersWithUserId: orders.filter((o) => o.userId === user.id).length,
      ordersWithEmail: user.email
        ? orders.filter(
            (o) => o.email?.toLowerCase() === user.email?.toLowerCase()
          ).length
        : 0,
      // Log một vài order details để debug
      sampleOrder:
        orders.length > 0
          ? {
              id: orders[0].id,
              orderNumber: orders[0].orderNumber,
              userId: orders[0].userId,
              email: orders[0].email,
              itemCount: orders[0].orderItems?.length || 0,
            }
          : null,
    });

    // Nếu không tìm thấy đơn hàng, log thêm thông tin để debug
    if (orders.length === 0) {
      console.warn("[USER_ORDERS_GET] No orders found. Debug info:", {
        userId: user.id,
        userEmail: user.email,
        clerkId: user.clerkId,
        queryUsed: JSON.stringify(whereClause, null, 2),
        totalOrdersInDB: allOrdersCount,
        ordersWithUserId,
        ordersWithEmail,
      });

      // Thử query tất cả đơn hàng để xem có đơn hàng nào không
      const sampleOrders = await prisma.order.findMany({
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          userId: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      console.log("[USER_ORDERS_GET] Sample orders in DB:", sampleOrders);

      // Nếu có đơn hàng với email nhưng không tìm thấy, thử link tự động
      if (user.email && ordersWithEmail > 0) {
        console.log(
          "[USER_ORDERS_GET] Found orders with email but not linked. Attempting to link..."
        );
        // Link orders với user
        try {
          const linkResult = await prisma.order.updateMany({
            where: {
              userId: null,
              email: user.email,
            },
            data: {
              userId: user.id,
            },
          });
          console.log(
            `[USER_ORDERS_GET] Linked ${linkResult.count} orders to user`
          );

          // Query lại sau khi link
          const linkedOrders = await prisma.order.findMany({
            where: whereClause,
            select: {
              id: true,
              orderNumber: true,
              storeId: true,
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
            orderBy: {
              createdAt: "desc",
            },
          });
          return NextResponse.json(linkedOrders);
        } catch (linkError) {
          console.error("[USER_ORDERS_GET] Error linking orders:", linkError);
        }
      }
    }

    // Return with caching headers and CORS
    const response = NextResponse.json(orders, {
      headers: {
        "Content-Type": "application/json",
        // Cache for 30 seconds on client
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        // CORS headers for store frontend
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Cookie",
      },
    });
    return response;
  } catch (err: any) {
    console.error("[USER_ORDERS_GET_ERROR]", {
      error: err,
      message: err?.message,
      stack: err?.stack,
    });
    const response = new NextResponse(
      JSON.stringify({
        error: "Internal error",
        message: err?.message || "Failed to fetch orders",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Cookie",
        },
      }
    );
    return response;
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Cookie");
  return response;
}
