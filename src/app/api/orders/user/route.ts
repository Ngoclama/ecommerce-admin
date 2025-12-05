import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getUserFromDb } from "@/lib/permissions";

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

    // Lấy user từ database
    const user = await getUserFromDb(clerkUserId);
    if (!user) {
      console.warn("[USER_ORDERS_GET] User not found in database:", {
        clerkUserId,
        hasQueryParam: !!clerkUserIdFromQuery,
        hasAuth: !!clerkUserIdFromAuth,
      });

      // Trả về empty array thay vì 404 để tránh lỗi
      // User có thể chưa được sync vào database
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
        const linkResult = await prisma.order.updateMany({
          where: {
            userId: null, // Chưa có userId
            email: user.email, // Cùng email với user
          },
          data: {
            userId: user.id, // Link với user
          },
        });
        if (linkResult.count > 0) {
          console.log(
            `[USER_ORDERS_GET] Auto-linked ${linkResult.count} orders to user based on email`
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
    const whereClause: any = {
      OR: [
        { userId: user.id }, // Đơn hàng đã link với user
        ...(user.email ? [{ email: user.email }] : []), // Hoặc có cùng email
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

    // Return with caching headers for better performance
    return NextResponse.json(orders, {
      headers: {
        "Content-Type": "application/json",
        // Cache for 30 seconds on client
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        // Enable compression
        "Content-Encoding": "gzip",
      },
    });
  } catch (err: any) {
    console.error("[USER_ORDERS_GET_ERROR]", {
      error: err,
      message: err?.message,
      stack: err?.stack,
    });
    return new NextResponse(
      JSON.stringify({
        error: "Internal error",
        message: err?.message || "Failed to fetch orders",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
