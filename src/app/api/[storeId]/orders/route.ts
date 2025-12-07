import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ORDER_STATUS } from "@/lib/constants";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

    if (!storeId) {
      return new NextResponse("Store Id is required", { status: 400 });
    }

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
      take: 100,
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error("[ORDERS_GET_ERROR]", err);
    return new NextResponse(`Internal error`, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId } = await auth();
    const { storeId } = await params;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!storeId)
      return new NextResponse("Store id is required", { status: 400 });
    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

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
      const ordersToDelete = await prisma.order.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: {
          id: true,
          status: true,
          orderNumber: true,
        },
      });

      // Kiểm tra xem có đơn hàng nào không được phép xóa không
      const allowedStatusesToDelete = [
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.CANCELLED,
      ];
      const invalidOrders = ordersToDelete.filter(
        (order) => !(allowedStatusesToDelete as any).includes(order.status)
      );

      if (invalidOrders.length > 0) {
        const invalidOrderNumbers = invalidOrders
          .map((o) => `#${o.orderNumber}`)
          .join(", ");
        return NextResponse.json(
          {
            error: "Không thể xóa một số đơn hàng",
            message: `Chỉ có thể xóa đơn hàng đã giao thành công hoặc đã hủy. Các đơn sau đang ở trạng thái không hợp lệ: ${invalidOrderNumbers}`,
            invalidOrders: invalidOrders.map((o) => ({
              orderNumber: o.orderNumber,
              status: o.status,
            })),
          },
          { status: 400 }
        );
      }

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
      // Xóa tất cả - chỉ lấy đơn hàng đã giao hoặc đã hủy
      const allowedStatusesToDelete = [
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.CANCELLED,
      ];
      const ordersToDelete = await prisma.order.findMany({
        where: {
          storeId: storeId,
          status: { in: allowedStatusesToDelete as any },
        },
        select: { id: true },
      });

      orderIds = ordersToDelete.map((o) => o.id);

      if (orderIds.length === 0) {
        return NextResponse.json(
          {
            message:
              "Không có đơn hàng nào có thể xóa. Chỉ có thể xóa đơn hàng đã giao thành công hoặc đã hủy.",
          },
          { status: 400 }
        );
      }
    }

    if (orderIds.length > 0) {
      await prisma.return.deleteMany({
        where: { orderId: { in: orderIds } },
      });
    }
    const result = await prisma.order.deleteMany({
      where: {
        id: { in: orderIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted all orders.`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("[ORDERS_DELETE_ERROR]", error);
    if (error.code === "P2003") {
      return new NextResponse(
        "Failed to delete orders due to foreign key constraints.",
        { status: 400 }
      );
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
