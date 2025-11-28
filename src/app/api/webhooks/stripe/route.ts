import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
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
      const updateData: any = {
        isPaid: true,
        status: "PROCESSING",
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

      // Cập nhật order
      const order = await prisma.order.update({
        where: {
          id: orderId,
        },
        data: updateData,
      });

      console.log(`[STRIPE_WEBHOOK] Order ${orderId} updated:`, {
        isPaid: order.isPaid,
        email: order.email,
        phone: order.phone,
        address: order.address,
        city: order.city,
        postalCode: order.postalCode,
        country: order.country,
      });

      console.log(`[STRIPE_WEBHOOK] Order ${orderId} updated to PAID`);

      // Giảm inventory của các sản phẩm trong order
      try {
        const orderItems = await prisma.orderItem.findMany({
          where: {
            orderId: orderId,
          },
          include: {
            product: {
              include: {
                variants: true,
              },
            },
          },
        });

        // Cập nhật inventory cho từng item
        for (const item of orderItems) {
          if (item.sizeId && item.colorId) {
            // Tìm variant tương ứng
            const variant = item.product.variants.find(
              (v) => v.sizeId === item.sizeId && v.colorId === item.colorId
            );

            if (variant && variant.inventory >= item.quantity) {
              // Giảm inventory của variant
              await prisma.productVariant.update({
                where: {
                  id: variant.id,
                },
                data: {
                  inventory: {
                    decrement: item.quantity,
                  },
                },
              });
            } else {
              console.warn(
                `[STRIPE_WEBHOOK] Insufficient inventory for variant ${variant?.id}`
              );
            }
          }
        }
      } catch (inventoryError) {
        console.error("[STRIPE_WEBHOOK_INVENTORY_ERROR]", inventoryError);
        // Không fail webhook nếu inventory update lỗi, chỉ log
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
