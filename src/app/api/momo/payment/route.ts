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
    const { orderId, amount, orderInfo } = await req.json();

    // Support both: orderId only (from checkout) or direct amount/orderInfo (for testing)
    let finalOrderId: string;
    let finalAmount: number;
    let finalOrderInfo: string;

    if (orderId && !amount && !orderInfo) {
      // Mode 1: Get order from database (production flow)
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

      finalOrderId = orderId;
      finalAmount = Math.round(order.total);
      finalOrderInfo = `Payment for Order #${order.id.slice(-8)}`;

      // Update order with MoMo requestId for tracking
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: "MOMO",
        },
      });
    } else if (orderId && amount && orderInfo) {
      // Mode 2: Direct test mode (for testing page)
      finalOrderId = orderId;
      finalAmount = typeof amount === "number" ? amount : parseInt(amount);
      finalOrderInfo = orderInfo;
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Either provide orderId only (for production) or orderId + amount + orderInfo (for testing)",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate amount
    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Create MoMo payment
    const momoResponse = await createMoMoPayment(
      finalOrderId,
      finalAmount,
      finalOrderInfo
    );

    return NextResponse.json({
      success: true,
      payUrl: momoResponse.payUrl,
      deeplink: momoResponse.deeplink,
      qrCodeUrl: momoResponse.qrCodeUrl,
      orderId: finalOrderId,
      amount: finalAmount,
      orderInfo: finalOrderInfo,
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
