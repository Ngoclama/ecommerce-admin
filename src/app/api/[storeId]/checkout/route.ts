import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  props: { params: Promise<{ storeId: string }> }
) {
  const params = await props.params;
  const { storeId } = params;

  try {
    const { productIds } = await req.json();

    if (!productIds || productIds.length === 0) {
      return new NextResponse("Product ids are required", { status: 400 });
    }

    // 1. Lấy thông tin sản phẩm + Size + Color + Material để làm Snapshot
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        images: true,
        category: true,
        size: true,
        color: true,
      },
    });

    // 2. Tạo Line Items cho Stripe
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    products.forEach((product) => {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "VND",
          product_data: {
            name: product.name,
            description: `Size: ${product.size.name}, Color: ${product.color.name}`,
            images: product.images.map((image) => image.url),
          },
          unit_amount: Math.round(Number(product.price)),
        },
      });
    });

    const order = await prisma.order.create({
      data: {
        storeId: params.storeId,
        isPaid: false,
        orderItems: {
          create: productIds.map((productId: string) => {
            const product = products.find((p) => p.id === productId);
            if (!product) {
              // This case should ideally not happen if your logic is sound
              throw new Error("Product not found");
            }
            return {
              product: {
                connect: {
                  id: productId,
                },
              },
              sizeName: product.size.name, // Snapshot size name
              colorName: product.color.name, // Snapshot color name
            };
          }),
        },
      },
    });

    // 4. Tạo Stripe Session
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      success_url: `${process.env.FRONTEND_STORE_URL}/cart?success=1`,
      cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?canceled=1`,
      metadata: {
        orderId: order.id,
      },
    });

    return NextResponse.json(
      { url: session.url },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.log("[CHECKOUT_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
