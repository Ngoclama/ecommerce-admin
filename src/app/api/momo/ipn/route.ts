import { NextResponse } from "next/server";
import { verifyMoMoIPNSignature, getMoMoConfig } from "@/lib/momo";
import prisma from "@/lib/prisma";
import { API_MESSAGES, HTTP_STATUS } from "@/lib/constants";
import type { MoMoIPNRequest } from "@/lib/momo";

/**
 * POST /api/momo/ipn
 * MoMo IPN (Instant Payment Notification) callback handler
 * This endpoint is called by MoMo to notify payment status
 */
export async function POST(req: Request) {
  try {
    const ipnData: MoMoIPNRequest = await req.json();

    console.log("[MOMO_IPN] Received notification:", ipnData);

    // Verify signature
    const config = getMoMoConfig();
    const isValidSignature = verifyMoMoIPNSignature(ipnData, config.secretKey);

    if (!isValidSignature) {
      console.error("[MOMO_IPN] Invalid signature");
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: ipnData.orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      console.error("[MOMO_IPN] Order not found:", ipnData.orderId);
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Check payment status
    if (ipnData.resultCode === 0) {
      // Payment successful
      console.log("[MOMO_IPN] Payment successful for order:", order.id);

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          isPaid: true,
          status: "PROCESSING",
        },
      });

      // Update product variant inventory
      // Note: OrderItem has snapshot data (sizeId, colorId, materialId) instead of direct variant relation
      for (const item of order.orderItems) {
        if (item.sizeId && item.colorId) {
          // Find the variant based on snapshot data
          const variant = await prisma.productVariant.findFirst({
            where: {
              productId: item.productId,
              sizeId: item.sizeId,
              colorId: item.colorId,
              materialId: item.materialId || null,
            },
          });

          if (variant) {
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: {
                inventory: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      }

      console.log(
        "[MOMO_IPN] Order updated and inventory decremented:",
        order.id
      );
    } else {
      // Payment failed or cancelled
      console.log(
        "[MOMO_IPN] Payment failed/cancelled:",
        ipnData.message,
        "for order:",
        order.id
      );

      // Optionally update order status to CANCELLED or FAILED
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
        },
      });
    }

    // Always return 200 OK to MoMo to acknowledge receipt
    return NextResponse.json({
      success: true,
      message: "IPN received successfully",
    });
  } catch (error) {
    console.error("[MOMO_IPN_ERROR]", error);

    // Still return 200 to prevent MoMo from retrying
    // Log error for manual investigation
    return NextResponse.json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * GET /api/momo/ipn
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "MoMo IPN endpoint is ready",
  });
}
