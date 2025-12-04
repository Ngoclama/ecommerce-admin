import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { VNPay, ProductCode, VnpLocale } from "vnpay";

interface CheckoutItem {
  productId: string;
  variantId?: string;
  sizeId?: string;
  colorId?: string;
  materialId?: string;
  quantity: number;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  province: string;
  district: string;
  ward: string;
}

interface CouponData {
  code: string;
  value: number;
  type: "PERCENT" | "FIXED";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const {
      items,
      shippingAddress,
      shippingMethod = "standard",
      coupon,
      customerNote,
    }: {
      items: CheckoutItem[];
      shippingAddress: ShippingAddress;
      shippingMethod?: string;
      coupon?: CouponData | null;
      customerNote?: string | null;
    } = await req.json();

    if (!items || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 });
    }

    if (!shippingAddress) {
      return new NextResponse("Shipping address is required", { status: 400 });
    }

    // Validate VNPay configuration
    if (!process.env.VNPAY_TMN_CODE || !process.env.VNPAY_SECURE_SECRET) {
      console.error("[VNPAY] Missing configuration");
      return new NextResponse("VNPay payment is not configured", {
        status: 500,
      });
    }

    const productIds = items.map((item) => item.productId);

    // Fetch products with variants
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

    let subtotal = 0;

    // Calculate subtotal and validate inventory
    for (const checkoutItem of items) {
      const product = products.find((p) => p.id === checkoutItem.productId);

      if (!product) {
        return new NextResponse(
          `Product ID ${checkoutItem.productId} not found.`,
          { status: 404 }
        );
      }

      // Find matching variant
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

      // Validate inventory
      if (variant) {
        if (variant.inventory < checkoutItem.quantity) {
          return new NextResponse(
            `Sản phẩm '${product.name}' (${variant.size.name}/${variant.color.name}) chỉ còn ${variant.inventory} cái.`,
            { status: 400 }
          );
        }
      } else {
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
    }

    // Calculate discount
    let discount = 0;
    if (coupon) {
      if (coupon.type === "PERCENT") {
        discount = (subtotal * coupon.value) / 100;
      } else if (coupon.type === "FIXED") {
        discount = coupon.value;
      }
    }

    // Calculate shipping fee
    const shippingCost =
      subtotal >= 500000 ? 0 : shippingMethod === "express" ? 50000 : 30000;

    const tax = 0;
    const total = Math.max(0, subtotal - discount + shippingCost + tax);

    // Create Order in database
    const order = await prisma.order.create({
      data: {
        storeId: storeId,
        isPaid: false,
        status: "PENDING",
        paymentMethod: "VNPAY",
        subtotal,
        tax,
        discount,
        shippingCost,
        total,
        phone: shippingAddress.phone,
        email: shippingAddress.email,
        address: `${shippingAddress.address}, ${shippingAddress.ward}, ${shippingAddress.district}, ${shippingAddress.province}`,
        city: shippingAddress.province,
        shippingMethod: shippingMethod,
        customerNote: customerNote || null,
        orderItems: {
          create: items.map((checkoutItem) => {
            const product = products.find(
              (p) => p.id === checkoutItem.productId
            );
            if (!product)
              throw new Error(
                `Product ${checkoutItem.productId} missing during order creation.`
              );

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

    // Initialize VNPay
    const vnpay = new VNPay({
      tmnCode: process.env.VNPAY_TMN_CODE,
      secureSecret: process.env.VNPAY_SECURE_SECRET,
      vnpayHost: process.env.VNPAY_HOST || "https://sandbox.vnpayment.vn",
      testMode: process.env.NODE_ENV !== "production",
    });

    // Get client IP address
    const ipAddr =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Build VNPay payment URL
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: total,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: order.id,
      vnp_OrderInfo: `Thanh toan don hang ${order.id}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `${process.env.FRONTEND_STORE_URL}/account/orders?payment=success&method=vnpay`,
      vnp_Locale: VnpLocale.VN,
    });

    return NextResponse.json({
      success: true,
      paymentUrl,
      orderId: order.id,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[VNPAY_CHECKOUT_ERROR]", error);
    }
    return new NextResponse(
      "Internal Server Error: VNPay checkout processing failed.",
      { status: 500 }
    );
  }
}
