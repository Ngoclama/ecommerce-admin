import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

interface CheckoutItem {
  productId: string;
  variantId?: string; // Variant ID (nếu có)
  sizeId?: string; // Fallback: Size ID
  colorId?: string; // Fallback: Color ID
  materialId?: string; // Fallback: Material ID
  quantity: number;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { items }: { items: CheckoutItem[] } = await req.json();

    if (!items || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 });
    }

    const productIds = items.map((item) => item.productId);

    // Lấy thông tin chi tiết của tất cả sản phẩm với variants
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

    // Kiểm tra nếu sản phẩm bị thiếu hoặc trùng lặp (phòng thủ)
    if (products.length !== new Set(productIds).size) {
      return new NextResponse("One or more products not found in the store.", {
        status: 404,
      });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;

    // Lặp qua các items đã gửi lên
    for (const checkoutItem of items) {
      const product = products.find((p) => p.id === checkoutItem.productId);

      if (!product) {
        return new NextResponse(
          `Product ID ${checkoutItem.productId} not found.`,
          { status: 404 }
        );
      }

      // Tìm variant phù hợp
      let variant = null;
      if (checkoutItem.variantId) {
        variant = product.variants.find((v) => v.id === checkoutItem.variantId);
      } else if (checkoutItem.sizeId && checkoutItem.colorId) {
        variant = product.variants.find(
          (v) =>
            v.sizeId === checkoutItem.sizeId &&
            v.colorId === checkoutItem.colorId &&
            (!checkoutItem.materialId ||
              v.materialId === checkoutItem.materialId)
        );
      }

      // Kiểm tra tồn kho từ variant hoặc product
      if (variant) {
        if (variant.inventory < checkoutItem.quantity) {
          return new NextResponse(
            `Sản phẩm '${product.name}' (${variant.size.name}/${variant.color.name}) chỉ còn ${variant.inventory} cái.`,
            { status: 400 }
          );
        }
      } else {
        // Fallback: kiểm tra tổng inventory từ tất cả variants
        const totalInventory = product.variants.reduce(
          (sum, v) => sum + v.inventory,
          0
        );
        if (totalInventory < checkoutItem.quantity) {
          return new NextResponse(
            `Sản phẩm '${product.name}' chỉ còn ${totalInventory} cái.`,
            { status: 400 }
          );
        }
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

    // Tính toán tổng giá trị đơn hàng
    const tax = 0; // Có thể tính từ subtotal
    const discount = 0; // Có thể áp dụng coupon
    const shippingCost = 0; // Có thể tính từ shipping method
    const total = subtotal + tax + shippingCost - discount;

    // Tạo Order với đầy đủ thông tin
    const order = await prisma.order.create({
      data: {
        storeId: storeId,
        isPaid: false,
        status: "PENDING",
        subtotal,
        tax,
        discount,
        shippingCost,
        total,
        orderItems: {
          create: items.map((checkoutItem) => {
            const product = products.find(
              (p) => p.id === checkoutItem.productId
            );
            if (!product)
              throw new Error(
                `Product ${checkoutItem.productId} missing during order creation.`
              );

            // Tìm variant tương ứng
            let variant = null;
            if (checkoutItem.variantId) {
              variant = product.variants.find(
                (v) => v.id === checkoutItem.variantId
              );
            } else if (checkoutItem.sizeId && checkoutItem.colorId) {
              variant = product.variants.find(
                (v) =>
                  v.sizeId === checkoutItem.sizeId &&
                  v.colorId === checkoutItem.colorId &&
                  (!checkoutItem.materialId ||
                    v.materialId === checkoutItem.materialId)
              );
            }

            // Lấy giá từ variant hoặc product
            const itemPrice = variant?.price
              ? Number(variant.price)
              : Number(product.price);

            return {
              product: { connect: { id: checkoutItem.productId } },
              sizeId: variant?.sizeId || checkoutItem.sizeId || null,
              colorId: variant?.colorId || checkoutItem.colorId || null,
              materialId:
                variant?.materialId || checkoutItem.materialId || null,
              sizeName: variant?.size.name || null,
              colorName: variant?.color.name || null,
              materialName: variant?.material?.name || null,
              productPrice: itemPrice,
              price: itemPrice,
              productName: product.name,
              quantity: checkoutItem.quantity,
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
      success_url: `${
        process.env.FRONTEND_STORE_URL ||
        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")
      }/payment/success?orderId=${order.id}&method=stripe`,
      cancel_url: `${
        process.env.FRONTEND_STORE_URL ||
        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")
      }/checkout?canceled=1&orderId=${order.id}`,
      metadata: {
        orderId: order.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[CHECKOUT_POST_ERROR]", error);
    }
    return new NextResponse(
      "Internal Server Error: Checkout Processing Failed.",
      { status: 500 }
    );
  }
}
