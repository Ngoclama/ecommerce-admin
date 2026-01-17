import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { decrementOrderInventory } from "@/lib/inventory-service";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error: any) {
    console.error("[STRIPE_WEBHOOK_ERROR]", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Xử lý event checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Lấy orderId từ metadata
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error("[STRIPE_WEBHOOK] No orderId in metadata");
      return new NextResponse("No orderId in metadata", { status: 400 });
    }

    try {
      // Lấy order hiện tại để kiểm tra thông tin đã có
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!existingOrder) {
        console.error(`[STRIPE_WEBHOOK] Order ${orderId} not found`);
        return new NextResponse("Order not found", { status: 404 });
      }

      // Retrieve full session từ Stripe để lấy đầy đủ thông tin
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["customer", "payment_intent"],
      });

      // Lấy thông tin customer details và shipping details
      const customerDetails = fullSession.customer_details;
      const shippingDetails =
        (fullSession as any).shipping_details || (fullSession as any).shipping;
      const metadata = fullSession.metadata || {};

      // Chuẩn bị data để cập nhật
      // Note: isPaid should already be true for online payments (set when order created)
      // But we verify and ensure it's true here as well
      const updateData: any = {
        isPaid: true, // Ensure isPaid = true (should already be set for STRIPE orders)
        status: existingOrder.isPaid ? "PROCESSING" : "PROCESSING", // Already PROCESSING if paid
        paymentMethod: "STRIPE",
        transactionId: fullSession.payment_intent
          ? typeof fullSession.payment_intent === "string"
            ? fullSession.payment_intent
            : fullSession.payment_intent.id
          : null,
      };

      // Cập nhật email: ưu tiên từ Stripe, nếu không có thì giữ nguyên
      if (customerDetails?.email) {
        updateData.email = customerDetails.email;
      } else if (
        (!existingOrder.email || existingOrder.email === "") &&
        metadata.shippingEmail
      ) {
        updateData.email = metadata.shippingEmail;
      } else if (!existingOrder.email || existingOrder.email === "") {
        // Thử lấy từ metadata với key khác
        const emailFromMeta = metadata.email || metadata.shipping_email;
        if (emailFromMeta) {
          updateData.email = emailFromMeta;
        }
      }

      // Cập nhật phone: ưu tiên từ Stripe, sau đó metadata, cuối cùng giữ nguyên nếu đã có
      if (customerDetails?.phone) {
        updateData.phone = customerDetails.phone;
      } else if (shippingDetails?.phone) {
        updateData.phone = shippingDetails.phone;
      } else if (
        (!existingOrder.phone || existingOrder.phone === "") &&
        metadata.shippingPhone
      ) {
        updateData.phone = metadata.shippingPhone;
      } else if (!existingOrder.phone || existingOrder.phone === "") {
        // Nếu vẫn không có, thử lấy từ metadata với key khác
        const phoneFromMeta = metadata.phone || metadata.shipping_phone;
        if (phoneFromMeta) {
          updateData.phone = phoneFromMeta;
        }
      }

      // Cập nhật address: ưu tiên từ Stripe shipping, sau đó metadata, cuối cùng giữ nguyên nếu đã có
      if (shippingDetails?.address) {
        const addr = shippingDetails.address;
        updateData.address = `${addr.line1 || ""} ${addr.line2 || ""}`.trim();
        if (addr.city) updateData.city = addr.city;
        if (addr.postal_code) updateData.postalCode = addr.postal_code;
        if (addr.country) updateData.country = addr.country;
      } else if (customerDetails?.address) {
        const addr = customerDetails.address;
        updateData.address = `${addr.line1 || ""} ${addr.line2 || ""}`.trim();
        if (addr.city) updateData.city = addr.city;
        if (addr.postal_code) updateData.postalCode = addr.postal_code;
        if (addr.country) updateData.country = addr.country;
      } else if (!existingOrder.address && metadata.shippingAddress) {
        // Sử dụng thông tin từ metadata (checkout form)
        updateData.address = `${metadata.shippingAddress}, ${
          metadata.shippingWard || ""
        }, ${metadata.shippingDistrict || ""}, ${
          metadata.shippingProvince || ""
        }`.trim();
        if (metadata.shippingProvince)
          updateData.city = metadata.shippingProvince;
        if (metadata.shippingWard)
          updateData.postalCode = metadata.shippingWard;
        updateData.country = "Vietnam";
      }

      // Link order với user dựa trên email (nếu chưa có userId)
      if (!existingOrder.userId && updateData.email) {
        try {
          const normalizedEmail = updateData.email.toLowerCase().trim();

          // Tìm user theo email (exact match hoặc normalized)
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ email: updateData.email }, { email: normalizedEmail }],
            },
          });

          if (user) {
            updateData.userId = user.id;
            console.log(
              `[STRIPE_WEBHOOK] Linking order ${orderId} to user ${user.id} via email ${updateData.email}`,
            );
          }
        } catch (linkError) {
          console.error(
            "[STRIPE_WEBHOOK] Error linking order to user:",
            linkError,
          );
          // Không fail webhook nếu link lỗi, chỉ log
        }
      }

      // Cập nhật order
      const order = await prisma.order.update({
        where: {
          id: orderId,
        },
        data: updateData,
      });

      console.log(`[STRIPE_WEBHOOK] Order ${orderId} updated:`, {
        isPaid: order.isPaid,
        userId: order.userId,
        email: order.email,
        phone: order.phone,
        address: order.address,
        city: order.city,
        postalCode: order.postalCode,
        country: order.country,
      });

      console.log(`[STRIPE_WEBHOOK] Order ${orderId} updated to PAID`);

      // CHỈ giảm inventory nếu đơn hàng mới được thanh toán (không phải đã thanh toán trước)
      // Sử dụng flag inventoryDecremented để tránh xử lý lại nếu webhook gọi nhiều lần
      if (!existingOrder.isPaid && !existingOrder.inventoryDecremented) {
        console.log(
          `[STRIPE_WEBHOOK] Decrementing inventory for order ${orderId}...`,
        );
        const inventoryResult = await decrementOrderInventory(orderId);

        if (inventoryResult.success) {
          console.log(
            `[STRIPE_WEBHOOK] ✅ Inventory decremented: ${inventoryResult.decremented} items`,
          );
        } else {
          console.error(
            `[STRIPE_WEBHOOK] ❌ Inventory decrement failed: ${inventoryResult.message}`,
          );
          // Không fail webhook, chỉ log warning
        }
      } else if (existingOrder.inventoryDecremented) {
        console.log(
          `[STRIPE_WEBHOOK] ⚠️ Order ${orderId} inventory already decremented - skipping to avoid double decrement`,
        );
      } else {
        console.log(
          `[STRIPE_WEBHOOK] Order ${orderId} was already paid - inventory should have been decremented`,
        );
      }

      return new NextResponse(null, { status: 200 });
    } catch (error) {
      console.error("[STRIPE_WEBHOOK_UPDATE_ERROR]", error);
      return new NextResponse("Error updating order", { status: 500 });
    }
  }

  // Xử lý các event khác nếu cần
  if (event.type === "payment_intent.succeeded") {
    console.log("[STRIPE_WEBHOOK] Payment intent succeeded");
  }

  return new NextResponse(null, { status: 200 });
}
