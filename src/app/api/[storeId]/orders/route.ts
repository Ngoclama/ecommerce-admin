// API route để quản lý orders
// GET: Lấy danh sách tất cả đơn hàng của store
// DELETE: Xóa tất cả đơn hàng của store (dùng để reset data)

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * GET: Lấy danh sách tất cả đơn hàng của store
 * Trả về kèm thông tin sản phẩm trong từng đơn hàng
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

    // Kiểm tra storeId có được truyền vào không
    if (!storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

    // Tối ưu: chỉ select các field cần thiết
    const orders = await prisma.order.findMany({
      where: {
        storeId: storeId,
      },
      select: {
        id: true,
        phone: true,
        address: true,
        email: true,
        total: true,
        isPaid: true,
        status: true,
        shippingMethod: true,
        trackingNumber: true,
        paymentMethod: true,
        createdAt: true,
        updatedAt: true,
        orderItems: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                images: {
                  select: {
                    url: true,
                  },
                  take: 1, // Chỉ lấy 1 ảnh đầu tiên
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Giới hạn số lượng
    });

    return NextResponse.json(orders);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[ORDERS_GET] ${err}`);
    }
    return new NextResponse(`Internal error`, { status: 500 });
  }
}

/**
 * DELETE: Xóa tất cả đơn hàng của store
 * Dùng để reset data khi cần, ví dụ khi test hoặc cleanup
 * Phải xóa theo thứ tự để tránh lỗi foreign key constraint
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId } = await auth();
    const { storeId } = await params;

    // Kiểm tra authentication
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!storeId)
      return new NextResponse("Store id is required", { status: 400 });

    // Kiểm tra store có thuộc về user không
    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

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

    let orderIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific orders by IDs
      const ordersToDelete = await prisma.order.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      orderIds = ordersToDelete.map((o) => o.id);

      if (orderIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid orders found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all orders (original behavior)
      const ordersToDelete = await prisma.order.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      orderIds = ordersToDelete.map((o) => o.id);
    }

    // Nếu có đơn hàng thì bắt đầu xóa
    if (orderIds.length > 0) {
      // 1. Xóa Return trước (vì Return có foreign key tới Order)
      // Return không có cascade delete nên phải xóa thủ công
      await prisma.return.deleteMany({
        where: { orderId: { in: orderIds } },
      });

      // 2. OrderItem sẽ tự động xóa khi xóa Order
      // Vì trong schema có onDelete: Cascade
    }

    // 3. Cuối cùng mới xóa các orders đã chọn
    const result = await prisma.order.deleteMany({
      where: {
        id: { in: orderIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted all orders.`,
      count: result.count, // Số lượng đơn hàng đã xóa
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ORDERS_DELETE_ALL_ERROR]", error);
    }

    // Xử lý lỗi foreign key constraint
    // Xảy ra khi có bảng khác đang reference tới orders
    if (error.code === "P2003") {
      return new NextResponse(
        "Failed to delete orders due to foreign key constraints.",
        { status: 400 }
      );
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
