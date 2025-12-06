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

      // Link order với user dựa trên email (nếu chưa có userId)
      const updateData: any = {
        isPaid: true,
        status: "PROCESSING",
      };

      if (!order.userId && order.email) {
        try {
          const normalizedEmail = order.email.toLowerCase().trim();
          
          // Tìm user theo email (exact match hoặc normalized)
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: order.email },
                { email: normalizedEmail },
              ],
            },
          });

          if (user) {
            updateData.userId = user.id;
            console.log(`[MOMO_IPN] Linking order ${order.id} to user ${user.id} via email ${order.email}`);
          }
        } catch (linkError) {
          console.error("[MOMO_IPN] Error linking order to user:", linkError);
          // Không fail webhook nếu link lỗi, chỉ log
        }
      }

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: updateData,
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

      // Delete order if unpaid and PENDING (payment was cancelled)
      if (!order.isPaid && order.status === "PENDING") {
        try {
          await prisma.order.delete({
            where: { id: order.id },
          });
          console.log("[MOMO_IPN] Order deleted after payment failure:", order.id);
        } catch (deleteError) {
          console.error("[MOMO_IPN] Error deleting order:", deleteError);
          // Fallback: update status to CANCELLED if delete fails
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "CANCELLED",
            },
          });
        }
      } else {
        // Update order status to CANCELLED if already paid or not PENDING
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELLED",
          },
        });
      }
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
