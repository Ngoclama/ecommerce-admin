import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {
  API_MESSAGES,
  HTTP_STATUS,
  ORDER_STATUS,
  NOTIFICATION_TYPES,
} from "@/lib/constants";
import { NextResponse } from "next/server";
import {
  triggerOrderStatusUpdate,
  triggerNotificationCreated,
} from "@/lib/pusher";

/**
 * PATCH /api/orders/[id]/status
 * Update order status (Admin only)
 * For testing: Update order status and trigger notifications
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    // Verify admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== "ADMIN") {
      return new NextResponse(API_MESSAGES.UNAUTHORIZED, {
        status: HTTP_STATUS.FORBIDDEN,
      });
    }

    const body = await req.json();
    const { status } = body as { status: string };

    if (!status || !Object.values(ORDER_STATUS).includes(status as any)) {
      return new NextResponse(API_MESSAGES.INVALID_DATA, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, orderNumber: true },
    });

    if (!order) {
      return new NextResponse(API_MESSAGES.ORDER_NOT_FOUND, {
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Update status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: status as any },
    });

    // Create notification
    const notificationMessage =
      status === ORDER_STATUS.SHIPPED
        ? `Đơn hàng #${order.orderNumber} đang giao`
        : status === ORDER_STATUS.DELIVERED
        ? `Đơn hàng #${order.orderNumber} đã giao thành công`
        : `Đơn hàng #${order.orderNumber} - ${status}`;

    const notificationType =
      status === ORDER_STATUS.SHIPPED
        ? NOTIFICATION_TYPES.ORDER_SHIPPING
        : status === ORDER_STATUS.DELIVERED
        ? NOTIFICATION_TYPES.ORDER_DELIVERED
        : NOTIFICATION_TYPES.ORDER_CONFIRMED;

    const notification = await prisma.notification.create({
      data: {
        userId: order.userId!,
        orderId: id,
        message: notificationMessage,
        type: notificationType,
        isRead: false,
      },
    });

    // Trigger Pusher
    await Promise.all([
      triggerOrderStatusUpdate(order.userId!, id, status, notificationMessage),
      triggerNotificationCreated(order.userId!, notification),
    ]);

    return NextResponse.json({
      message: API_MESSAGES.UPDATED,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("[PATCH /api/orders/[id]/status]", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
