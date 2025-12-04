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
        discount = Math.round((subtotal * coupon.value) / 100);
      } else if (coupon.type === "FIXED") {
        discount = coupon.value;
      }
      // Đảm bảo discount không vượt quá subtotal
      discount = Math.min(discount, subtotal);
    }

    // Calculate shipping fee
    const shippingCost =
      subtotal >= 500000 ? 0 : shippingMethod === "express" ? 50000 : 30000;

    const tax = 0;
    // Tính total: subtotal - discount + shipping + tax
    const total = Math.max(0, Math.round(subtotal - discount + shippingCost + tax));

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

    // Determine VNPay host - use production URL if in production mode
    const isProduction = process.env.NODE_ENV === "production";
    const vnpayHost = process.env.VNPAY_HOST || 
      (isProduction ? "https://www.vnpayment.vn" : "https://sandbox.vnpayment.vn");

    // Initialize VNPay
    const vnpay = new VNPay({
      tmnCode: process.env.VNPAY_TMN_CODE,
      secureSecret: process.env.VNPAY_SECURE_SECRET,
      vnpayHost: vnpayHost,
      testMode: !isProduction,
    });

    // Get client IP address
    const ipAddr =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // VNPay SDK automatically multiplies by 100 internally
    // Pass the amount directly in VND (do NOT multiply by 100)
    const vnpAmount = Math.round(total);

    // Build return URL - ensure it's a public URL
    const returnUrlBase = process.env.FRONTEND_STORE_URL || 
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:3001";
    
    const returnUrl = `${returnUrlBase}/payment/success?orderId=${order.id}&method=vnpay`;

    // Build VNPay payment URL
    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: vnpAmount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: order.id,
      vnp_OrderInfo: `Thanh toan don hang ${order.id.slice(-8)}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl,
      vnp_Locale: VnpLocale.VN,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[VNPAY] Payment URL created:", {
        orderId: order.id,
        subtotal,
        discount,
        shippingCost,
        tax,
        total,
        vnpAmount,
        calculation: `${total} * 100 = ${vnpAmount}`,
        returnUrl,
        vnpayHost,
        isProduction,
      });
    }

    return NextResponse.json({
      success: true,
      paymentUrl,
      orderId: order.id,
    });
  } catch (error) {
    console.error("[VNPAY_CHECKOUT_ERROR]", {
      error,
      vnpayConfig: {
        hasTmnCode: !!process.env.VNPAY_TMN_CODE,
        hasSecureSecret: !!process.env.VNPAY_SECURE_SECRET,
        vnpayHost: process.env.VNPAY_HOST || (process.env.NODE_ENV === "production" ? "https://www.vnpayment.vn" : "https://sandbox.vnpayment.vn"),
        isProduction: process.env.NODE_ENV === "production",
      },
    });

    const errorMessage = error instanceof Error
      ? error.message
      : "Internal Server Error: VNPay checkout processing failed.";

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: "Không thể tạo thanh toán VNPay. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
