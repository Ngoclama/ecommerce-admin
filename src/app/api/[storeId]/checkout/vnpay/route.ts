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
    const total = Math.max(
      0,
      Math.round(subtotal - discount + shippingCost + tax)
    );

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
    // Priority: VNPAY_HOST env var > VERCEL_ENV check > NODE_ENV check > default to production on Vercel
    const isVercel = !!process.env.VERCEL;
    const isVercelProduction = process.env.VERCEL_ENV === "production";
    const isNodeProduction = process.env.NODE_ENV === "production";

    // If VNPAY_HOST is explicitly set, use it
    // Otherwise, use production if on Vercel production or if NODE_ENV is production
    // Default to production for safety (better to fail with production than accidentally use sandbox)
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

    // Always log VNPay configuration for production debugging
    // This helps identify issues in production
    console.log("[VNPAY] Configuration:", {
      isProduction,
      vnpayHost,
      testMode,
      isVercel,
      isVercelProduction,
      isNodeProduction,
      hasTmnCode: !!process.env.VNPAY_TMN_CODE,
      hasSecureSecret: !!process.env.VNPAY_SECURE_SECRET,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercel: process.env.VERCEL,
    });

    // Initialize VNPay
    // testMode should be false for production, true for sandbox
    const testMode = vnpayHost.includes("sandbox");

    const vnpay = new VNPay({
      tmnCode: process.env.VNPAY_TMN_CODE,
      secureSecret: process.env.VNPAY_SECURE_SECRET,
      vnpayHost: vnpayHost,
      testMode: testMode,
    });

    // Get client IP address
    // On Vercel, x-forwarded-for contains the real client IP
    // Format: "client-ip, proxy1-ip, proxy2-ip"
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddr = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : req.headers.get("x-real-ip") ||
        req.headers.get("cf-connecting-ip") || // Cloudflare
        "127.0.0.1";

    // Log IP for debugging
    if (
      process.env.NODE_ENV === "development" ||
      process.env.VNPAY_DEBUG === "true"
    ) {
      console.log("[VNPAY] Client IP:", {
        ipAddr,
        xForwardedFor: req.headers.get("x-forwarded-for"),
        xRealIp: req.headers.get("x-real-ip"),
        cfConnectingIp: req.headers.get("cf-connecting-ip"),
      });
    }

    // VNPay SDK automatically multiplies by 100 internally
    // Pass the amount directly in VND (do NOT multiply by 100)
    const vnpAmount = Math.round(total);

    // Build return URL - ensure it's a public URL
    // Priority: FRONTEND_STORE_URL > VERCEL_URL (for Vercel) > NEXT_PUBLIC_API_URL > localhost
    let returnUrlBase = process.env.FRONTEND_STORE_URL;

    if (!returnUrlBase) {
      // On Vercel, use VERCEL_URL if available
      if (process.env.VERCEL_URL) {
        returnUrlBase = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NEXT_PUBLIC_API_URL) {
        returnUrlBase = process.env.NEXT_PUBLIC_API_URL.replace("/api", "");
      } else {
        returnUrlBase = "http://localhost:3001";
      }
    }

    // Ensure returnUrlBase doesn't have trailing slash
    returnUrlBase = returnUrlBase.replace(/\/$/, "");

    const returnUrl = `${returnUrlBase}/payment/success?orderId=${order.id}&method=vnpay`;

    // Log return URL for debugging (only in development or if explicitly enabled)
    if (
      process.env.NODE_ENV === "development" ||
      process.env.VNPAY_DEBUG === "true"
    ) {
      console.log("[VNPAY] Return URL:", {
        returnUrl,
        returnUrlBase,
        envVars: {
          FRONTEND_STORE_URL: process.env.FRONTEND_STORE_URL,
          VERCEL_URL: process.env.VERCEL_URL,
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        },
      });
    }

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
        vnpayHost:
          process.env.VNPAY_HOST ||
          (process.env.NODE_ENV === "production"
            ? "https://www.vnpayment.vn"
            : "https://sandbox.vnpayment.vn"),
        isProduction: process.env.NODE_ENV === "production",
      },
    });

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Internal Server Error: VNPay checkout processing failed.";

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message:
          "Không thể tạo thanh toán VNPay. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
