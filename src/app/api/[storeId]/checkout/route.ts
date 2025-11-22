import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { productIds } = await req.json();

    if (!productIds || productIds.length === 0) {
      return new NextResponse("Product ids are required", { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        size: true,
        color: true,
        images: true,
      },
    });

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let totalPrice = 0; // 1. Khởi tạo biến tổng tiền

    for (const product of products) {
      if (product.inventory <= 0) {
        return new NextResponse(`Sản phẩm '${product.name}' đã hết hàng.`, {
          status: 400,
        });
      }

      const unitAmount = Math.round(Number(product.price));
      totalPrice += unitAmount; // 2. Cộng dồn tiền vào tổng (với số lượng mặc định là 1)

      line_items.push({
        quantity: 1,
        price_data: {
          currency: "VND",
          product_data: {
            name: product.name,
            description: `Size: ${product.size.name}, Color: ${product.color.name}`,
            images: product.images?.[0]?.url ? [product.images[0].url] : [],
          },
          unit_amount: unitAmount,
        },
      });
    }

    const order = await prisma.order.create({
      data: {
        storeId: params.storeId,
        isPaid: false,
        totalPrice: totalPrice, // 3. Thêm trường này vào để fix lỗi
        orderItems: {
          create: productIds.map((productId: string) => {
            const product = products.find((p) => p.id === productId);
            return {
              product: { connect: { id: productId } },
              sizeName: product?.size.name,
              colorName: product?.color.name,
              productPrice: Number(product?.price), // Đảm bảo kiểu số
              productName: product?.name,
            };
          }),
        },
      },
    });

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

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log("[CHECKOUT_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
