import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

interface CheckoutItem {
  productId: string;
  variantId?: string;
  sizeId?: string;
  colorId?: string;
  materialId?: string;
  quantity: number;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    const { items }: { items: CheckoutItem[] } = await req.json();

    if (!items || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 });
    }

    const productIds = items.map((item) => item.productId);

    // Lấy thông tin sản phẩm (chỉ để lấy giá và mô tả, inventory đã được kiểm tra ở store)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        images: true,
        variants: {
          include: {
            size: true,
            color: true,
            material: true,
          },
        },
      },
    });

    if (products.length !== new Set(productIds).size) {
      return new NextResponse("One or more products not found in the store.", {
        status: 404,
      });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;

    // Lặp qua các items và tạo Stripe line items
    for (const checkoutItem of items) {
      const product = products.find((p) => p.id === checkoutItem.productId);

      if (!product) {
        return new NextResponse(
          `Product ID ${checkoutItem.productId} not found.`,
          { status: 404 },
        );
      }

      // Tìm variant
      let variant = null;
      if (checkoutItem.variantId) {
        variant = product.variants.find((v) => v.id === checkoutItem.variantId);
      } else if (checkoutItem.sizeId && checkoutItem.colorId) {
        variant = product.variants.find(
          (v) =>
            v.sizeId === checkoutItem.sizeId &&
            v.colorId === checkoutItem.colorId &&
            (!checkoutItem.materialId ||
              v.materialId === checkoutItem.materialId),
        );
      }

      // Lấy giá từ variant hoặc product
      const priceValue = variant?.price
        ? Number(variant.price)
        : Number(product.price);
      if (isNaN(priceValue)) {
        return new NextResponse(`Invalid price for product ${product.name}`, {
          status: 400,
        });
      }

      const unitAmount = Math.round(priceValue);
      subtotal += unitAmount * checkoutItem.quantity;

      // Tạo description từ variant
      const variantDesc = variant
        ? `Size: ${variant.size.name}, Color: ${variant.color.name}${
            variant.material ? `, Material: ${variant.material.name}` : ""
          }`
        : product.name;

      line_items.push({
        quantity: checkoutItem.quantity,
        price_data: {
          currency: "VND",
          product_data: {
            name: product.name,
            description: variantDesc,
            images: product.images?.[0]?.url ? [product.images[0].url] : [],
          },
          unit_amount: unitAmount,
        },
      });
    }

    // ⚠️ NOTE: Order đã được tạo ở /api/orders trên store
    // Endpoint này chỉ tạo Stripe checkout session
    // Inventory đã được trừ khi tạo order

    console.log(
      "[CHECKOUT_STRIPE] ✅ Creating Stripe session for items:",
      items.length,
    );

    // Tạo Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      success_url: `${
        process.env.FRONTEND_STORE_URL ||
        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")
      }/payment/success?method=stripe`,
      cancel_url: `${
        process.env.FRONTEND_STORE_URL ||
        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")
      }/payment/failure?method=stripe&reason=cancelled`,
    });

    console.log("[CHECKOUT_STRIPE] ✅ Session created:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return new NextResponse(
      "Internal Server Error: Checkout Processing Failed.",
      { status: 500 },
    );
  }
}
