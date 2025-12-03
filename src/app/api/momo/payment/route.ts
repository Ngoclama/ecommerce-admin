import { NextResponse } from "next/server";
import { createMoMoPayment } from "@/lib/momo";
import prisma from "@/lib/prisma";
import { API_MESSAGES, HTTP_STATUS } from "@/lib/constants";

/**
 * POST /api/momo/payment
 * Create MoMo payment for an order
 */
export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Check if order is already paid
    if (order.isPaid) {
      return NextResponse.json(
        { success: false, error: "Order is already paid" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Prepare order info
    const orderInfo = `Payment for Order #${order.id.slice(-8)}`;
    const amount = Math.round(order.total);

    // Create MoMo payment
    const momoResponse = await createMoMoPayment(orderId, amount, orderInfo);

    // Update order with MoMo requestId for tracking
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "MOMO",
      },
    });

    return NextResponse.json({
      success: true,
      payUrl: momoResponse.payUrl,
      deeplink: momoResponse.deeplink,
      qrCodeUrl: momoResponse.qrCodeUrl,
      orderId: order.id,
    });
  } catch (error) {
    console.error("[MOMO_PAYMENT_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create payment",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
