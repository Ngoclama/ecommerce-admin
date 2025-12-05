import { NextResponse } from "next/server";
import { VNPay } from "vnpay";
import prisma from "@/lib/prisma";

/**
 * POST /api/vnpay/ipn
 * VNPay IPN (Instant Payment Notification) callback handler
 * This endpoint is called by VNPay to notify payment status
 */
export async function POST(req: Request) {
  try {
    // VNPay sends data as URL-encoded form or query string
    const url = new URL(req.url);
    const vnpParams: Record<string, string> = {};

    // Parse query parameters
    url.searchParams.forEach((value, key) => {
      vnpParams[key] = value;
    });

    // If no query params, try to get from body (form data)
    if (Object.keys(vnpParams).length === 0) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        vnpParams[key] = value.toString();
      });
    }

    console.log("[VNPAY_IPN] Received notification:", vnpParams);

    // Validate VNPay configuration
    if (!process.env.VNPAY_TMN_CODE || !process.env.VNPAY_SECURE_SECRET) {
      console.error("[VNPAY_IPN] Missing configuration");
      return NextResponse.json(
        { RspCode: "97", Message: "Missing configuration" },
        { status: 400 }
      );
    }

    // Initialize VNPay for verification
    // Check VERCEL_ENV or NODE_ENV to determine environment
    const isProduction =
      process.env.VERCEL_ENV === "production" ||
      (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV);

    const vnpayHost =
      process.env.VNPAY_HOST ||
      (isProduction
        ? "https://www.vnpayment.vn"
        : "https://sandbox.vnpayment.vn");

    const vnpay = new VNPay({
      tmnCode: process.env.VNPAY_TMN_CODE,
      secureSecret: process.env.VNPAY_SECURE_SECRET,
      vnpayHost: vnpayHost,
      testMode: !isProduction,
    });

    // Verify signature
    // Type assertion needed because verifyReturnUrl expects ReturnQueryFromVNPay type
    const isValid = vnpay.verifyReturnUrl(vnpParams as any);

    if (!isValid) {
      console.error("[VNPAY_IPN] Invalid signature");
      return NextResponse.json(
        { RspCode: "97", Message: "Invalid signature" },
        { status: 400 }
      );
    }

    // Extract payment information
    const orderId = vnpParams["vnp_TxnRef"];
    const responseCode = vnpParams["vnp_ResponseCode"];
    const transactionNo = vnpParams["vnp_TransactionNo"];
    // VNPay SDK automatically multiplies by 100, so vnp_Amount is already in cents
    // We need to divide by 100 to get VND
    const amount = parseInt(vnpParams["vnp_Amount"]) / 100;

    if (!orderId) {
      console.error("[VNPAY_IPN] Missing order ID");
      return NextResponse.json(
        { RspCode: "99", Message: "Missing order ID" },
        { status: 400 }
      );
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      console.error("[VNPAY_IPN] Order not found:", orderId);
      return NextResponse.json(
        { RspCode: "01", Message: "Order not found" },
        { status: 404 }
      );
    }

    // Check if amount matches
    if (Math.abs(amount - order.total) > 1) {
      console.error("[VNPAY_IPN] Amount mismatch:", {
        received: amount,
        expected: order.total,
      });
      return NextResponse.json(
        { RspCode: "04", Message: "Amount mismatch" },
        { status: 400 }
      );
    }

    // Process payment result
    if (responseCode === "00") {
      // Payment successful
      console.log("[VNPAY_IPN] Payment successful for order:", orderId);

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          isPaid: true,
          status: "PROCESSING",
        },
      });

      // Update product variant inventory
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
        "[VNPAY_IPN] Order updated and inventory decremented:",
        order.id
      );

      // Return success response to VNPay
      return NextResponse.json({
        RspCode: "00",
        Message: "Success",
      });
    } else {
      // Payment failed or cancelled
      console.log(
        "[VNPAY_IPN] Payment failed/cancelled:",
        responseCode,
        "for order:",
        order.id
      );

      // Update order status to CANCELLED
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
        },
      });

      // Return response to VNPay
      return NextResponse.json({
        RspCode: responseCode || "99",
        Message: "Payment failed",
      });
    }
  } catch (error) {
    console.error("[VNPAY_IPN_ERROR]", error);
    return NextResponse.json(
      {
        RspCode: "99",
        Message: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vnpay/ipn
 * VNPay also sends GET requests for return URL
 */
export async function GET(req: Request) {
  // VNPay return URL is handled by frontend redirect
  // This endpoint can be used for verification if needed
  return NextResponse.json({ message: "Use POST for IPN" }, { status: 200 });
}
