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
import { getUserFromDb } from "@/lib/permissions";
import { userService } from "@/lib/services/user.service";

/**
 * POST /api/orders/[id]/cancel
 * Cancel order (User can cancel their own orders)
 * Only allows cancellation if status is PENDING or PROCESSING
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, message: API_MESSAGES.UNAUTHENTICATED },
        {
          status: HTTP_STATUS.UNAUTHORIZED,
        }
      );
    }

    // Get or create user using UserService (with auto-sync)
    const user = await userService.getOrCreateUser(clerkUserId, false, true);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        {
          status: HTTP_STATUS.NOT_FOUND,
        }
      );
    }

    // Get order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        email: true,
        status: true,
        orderNumber: true,
        isPaid: true,
        paymentMethod: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: API_MESSAGES.ORDER_NOT_FOUND },
        {
          status: HTTP_STATUS.NOT_FOUND,
        }
      );
    }

    // Verify ownership: user must own the order
    const ownsOrder =
      order.userId === user.id ||
      (order.email && order.email.toLowerCase() === user.email?.toLowerCase());

    if (!ownsOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "You don't have permission to cancel this order",
        },
        {
          status: HTTP_STATUS.FORBIDDEN,
        }
      );
    }

    // Check if order can be cancelled
    const canCancel =
      order.status === ORDER_STATUS.PENDING ||
      order.status === ORDER_STATUS.PROCESSING;

    if (!canCancel) {
      return NextResponse.json(
        {
          success: false,
          message: `Order cannot be cancelled. Current status: ${order.status}`,
        },
        {
          status: HTTP_STATUS.BAD_REQUEST,
        }
      );
    }

    // Update order status to CANCELLED
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: ORDER_STATUS.CANCELLED,
        // If order was paid, we might want to handle refund
        // For now, just update status
      },
    });

    // Create notification
    const notificationMessage = `Đơn hàng #${order.orderNumber} đã được hủy`;

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        orderId: id,
        message: notificationMessage,
        type: NOTIFICATION_TYPES.ORDER_CANCELLED,
        isRead: false,
      },
    });

    // Trigger Pusher notifications
    try {
      await Promise.all([
        triggerOrderStatusUpdate(
          user.id,
          id,
          ORDER_STATUS.CANCELLED,
          notificationMessage
        ),
        triggerNotificationCreated(user.id, notification),
      ]);
    } catch (pusherError) {
      // Don't fail the request if Pusher fails
      console.error("[CANCEL_ORDER] Pusher error:", pusherError);
    }

    // Log cancellation for admin tracking
    console.log("[CANCEL_ORDER] Order cancelled:", {
      orderId: id,
      orderNumber: order.orderNumber,
      userId: user.id,
      previousStatus: order.status,
      wasPaid: order.isPaid,
      paymentMethod: order.paymentMethod,
    });

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("[POST /api/orders/[id]/cancel]", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : API_MESSAGES.SERVER_ERROR,
      },
      {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
