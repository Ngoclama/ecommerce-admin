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
    const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
    const secureSecret = process.env.VNPAY_SECURE_SECRET?.trim();

    if (!tmnCode || !secureSecret) {
      console.error("[VNPAY_IPN] Missing configuration", {
        hasTmnCode: !!tmnCode,
        hasSecureSecret: !!secureSecret,
        tmnCodeLength: tmnCode?.length,
        secureSecretLength: secureSecret?.length,
      });
      return NextResponse.json(
        { RspCode: "97", Message: "Missing configuration" },
        { status: 400 }
      );
    }

    // Log secure secret for debugging (only first and last 2 chars for security)
    console.log("[VNPAY_IPN] Secure Secret Info:", {
      length: secureSecret.length,
      firstChars: secureSecret.substring(0, 2),
      lastChars: secureSecret.substring(secureSecret.length - 2),
      expected: "G9Y1BW7S",
      matches: secureSecret === "G9Y1BW7S",
    });

    // Initialize VNPay for verification
    // Priority: VNPAY_HOST env var > VERCEL_ENV check > NODE_ENV check > default to production on Vercel
    const isVercel = !!process.env.VERCEL;
    const isVercelProduction = process.env.VERCEL_ENV === "production";
    const isNodeProduction = process.env.NODE_ENV === "production";

    // If VNPAY_HOST is explicitly set, use it
    // Otherwise, use production if on Vercel production or if NODE_ENV is production
    // Default to production for safety
    const isProduction =
      process.env.VNPAY_HOST?.includes("www.vnpayment.vn") || // Explicitly production
      (isVercel && isVercelProduction) || // Vercel production
      (isNodeProduction && !isVercel) || // Node production (not Vercel)
      (isVercel && !process.env.VNPAY_HOST); // Vercel but no explicit host = assume production

    const vnpayHost =
      process.env.VNPAY_HOST ||
      (isProduction
        ? "https://www.vnpayment.vn"
        : "https://sandbox.vnpayment.vn");

    // testMode should be false for production, true for sandbox
    const testMode = vnpayHost.includes("sandbox");

    const vnpay = new VNPay({
      tmnCode: tmnCode,
      secureSecret: secureSecret,
      vnpayHost: vnpayHost,
      testMode: testMode,
    });

    // Log configuration for debugging
    console.log("[VNPAY_IPN] Configuration:", {
      isProduction,
      vnpayHost,
      testMode,
      isVercel,
      isVercelProduction,
      vercelEnv: process.env.VERCEL_ENV,
      warning: testMode
        ? "⚠️ Using SANDBOX mode for IPN verification"
        : "✅ Using PRODUCTION mode for IPN verification",
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

      // Link order với user dựa trên email (nếu chưa có userId)
      // Note: isPaid should already be true for VNPAY orders (set when order created)
      // But we verify and ensure it's true here as well
      const updateData: any = {
        isPaid: true, // Ensure isPaid = true (should already be set for VNPAY orders)
        status: order.isPaid ? "PROCESSING" : "PROCESSING", // Already PROCESSING if paid
      };

      // If order was not paid before (shouldn't happen for VNPAY, but safety check)
      // Decrement inventory now
      if (!order.isPaid) {
        // Decrement inventory for order items
        for (const item of order.orderItems) {
          if (item.sizeId && item.colorId) {
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
        console.log("[VNPAY_IPN] Inventory decremented for order:", order.id);
      }

      if (!order.userId && order.email) {
        try {
          const normalizedEmail = order.email.toLowerCase().trim();

          // Tìm user theo email (exact match hoặc normalized)
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ email: order.email }, { email: normalizedEmail }],
            },
          });

          if (user) {
            updateData.userId = user.id;
            console.log(
              `[VNPAY_IPN] Linking order ${order.id} to user ${user.id} via email ${order.email}`
            );
          }
        } catch (linkError) {
          console.error("[VNPAY_IPN] Error linking order to user:", linkError);
          // Không fail webhook nếu link lỗi, chỉ log
        }
      }

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: updateData,
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

      // Delete order if unpaid and PENDING (payment was cancelled)
      if (!order.isPaid && order.status === "PENDING") {
        try {
          await prisma.order.delete({
            where: { id: order.id },
          });
          console.log(
            "[VNPAY_IPN] Order deleted after payment failure:",
            order.id
          );
        } catch (deleteError) {
          console.error("[VNPAY_IPN] Error deleting order:", deleteError);
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
