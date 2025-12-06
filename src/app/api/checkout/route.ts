import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { createMoMoPayment } from "@/lib/momo";
import { VNPay, ProductCode, VnpLocale } from "vnpay";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserFromDb } from "@/lib/permissions";

// Helper function to get CORS headers based on request origin
const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    process.env.FRONTEND_STORE_URL,
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", ""),
    "https://ecommerce-store-henna-nine.vercel.app", // Store production URL
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter(Boolean) as string[];

  let allowedOrigin: string;

  if (origin) {
    const matchedOrigin = allowedOrigins.find(
      (url) => origin === url || origin.startsWith(url)
    );
    allowedOrigin = matchedOrigin || origin; // Use origin if it's provided
  } else {
    allowedOrigin =
      allowedOrigins[0] || "https://ecommerce-store-henna-nine.vercel.app";
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
};

interface CheckoutItem {
  productId: string;
  variantId?: string; // Variant ID (nếu có)
  sizeId?: string; // Fallback: Size ID
  colorId?: string; // Fallback: Color ID
  materialId?: string; // Fallback: Material ID
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

export async function POST(req: Request) {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      const corsHeaders = getCorsHeaders(req);
      return new NextResponse(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[CHECKOUT_PUBLIC_POST] Đã nhận request");
    }
    const {
      items,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      coupon,
      customerNote,
    }: {
      items: CheckoutItem[];
      shippingAddress?: ShippingAddress;
      shippingMethod?: string;
      paymentMethod?: string;
      coupon?: {
        code: string;
        value: number;
        type: "PERCENT" | "FIXED";
      } | null;
      customerNote?: string | null;
    } = await req.json();

    // Ghi log để debug (chỉ trong development)
    if (process.env.NODE_ENV === "development") {
      console.log("[CHECKOUT_PUBLIC_POST] Địa chỉ giao hàng:", shippingAddress);
      console.log(
        "[CHECKOUT_PUBLIC_POST] Phương thức giao hàng:",
        shippingMethod
      );
    }

    const corsHeaders = getCorsHeaders(req);

    if (!items || items.length === 0) {
      return NextResponse.json(
        { message: "Vui lòng thêm sản phẩm vào giỏ hàng." },
        { status: 400, headers: corsHeaders }
      );
    }

    const productIds = items.map((item) => item.productId);

    // Lấy thông tin chi tiết của tất cả sản phẩm với variants
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        isArchived: false,
        isPublished: true, // Chỉ cho phép checkout sản phẩm đã publish
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
      return NextResponse.json(
        {
          message:
            "Một hoặc nhiều sản phẩm không tìm thấy hoặc không khả dụng.",
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // Lấy storeId từ product đầu tiên (tất cả products phải cùng store)
    const storeId = products[0]?.storeId;
    if (!storeId) {
      return NextResponse.json(
        { message: "Không tìm thấy cửa hàng." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Kiểm tra tất cả products có cùng storeId
    const allSameStore = products.every((p) => p.storeId === storeId);
    if (!allSameStore) {
      return NextResponse.json(
        { message: "Tất cả sản phẩm phải từ cùng một cửa hàng." },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;

    // Lặp qua các items đã gửi lên
    for (const checkoutItem of items) {
      const product = products.find((p) => p.id === checkoutItem.productId);

      if (!product) {
        return NextResponse.json(
          {
            message: `Không tìm thấy sản phẩm với ID ${checkoutItem.productId}.`,
          },
          { status: 404, headers: corsHeaders }
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
          return NextResponse.json(
            {
              message: `Sản phẩm '${product.name}' (${variant.size.name}/${variant.color.name}) chỉ còn ${variant.inventory} cái.`,
            },
            { status: 400, headers: corsHeaders }
          );
        }
      } else {
        // Fallback: kiểm tra tổng inventory từ tất cả variants
        const totalInventory = product.variants.reduce(
          (sum, v) => sum + v.inventory,
          0
        );
        if (totalInventory < checkoutItem.quantity) {
          return NextResponse.json(
            {
              message: `Sản phẩm '${product.name}' chỉ còn ${totalInventory} cái.`,
            },
            { status: 400, headers: corsHeaders }
          );
        }
      }

      // Lấy giá từ variant hoặc product
      const priceValue = variant?.price
        ? Number(variant.price)
        : Number(product.price);
      if (isNaN(priceValue)) {
        return NextResponse.json(
          { message: `Giá không hợp lệ cho sản phẩm ${product.name}` },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      const unitAmount = Math.round(priceValue);
      subtotal += unitAmount * checkoutItem.quantity;

      // Tạo description từ variant
      const variantDesc = variant
        ? `Size: ${variant.size.name}, Màu: ${variant.color.name}${
            variant.material ? `, Chất liệu: ${variant.material.name}` : ""
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

    // Tính discount từ coupon nếu có
    let discount = 0;
    if (coupon) {
      if (coupon.type === "PERCENT") {
        discount = Math.round((subtotal * coupon.value) / 100);
      } else {
        discount = coupon.value;
      }
      // Đảm bảo discount không vượt quá subtotal
      discount = Math.min(discount, subtotal);
    }

    // Tính shipping cost dựa trên method và subtotal
    let shippingCost = 0;
    if (subtotal >= 500000) {
      shippingCost = 0; // Free shipping nếu >= 500k
    } else if (shippingMethod === "express") {
      shippingCost = 50000; // Express shipping
    } else {
      shippingCost = 30000; // Standard shipping
    }
    const total = subtotal + tax + shippingCost - discount;

    // Thêm shipping cost vào line items nếu > 0
    if (shippingCost > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "VND",
          product_data: {
            name: `Phí vận chuyển (${
              shippingMethod === "express" ? "Nhanh" : "Tiêu chuẩn"
            })`,
            description:
              shippingMethod === "express"
                ? "Giao hàng nhanh (1-2 ngày làm việc)"
                : "Giao hàng tiêu chuẩn (3-5 ngày làm việc)",
          },
          unit_amount: shippingCost,
        },
      });
    }

    // Lấy userId từ Clerk authentication
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const { userId: clerkUserId } = await auth();
      if (clerkUserId) {
        let user = await getUserFromDb(clerkUserId);

        // Nếu user chưa tồn tại trong database, tạo user mới
        if (!user) {
          try {
            // Lấy thông tin user từ Clerk API
            let realEmail = `user_${clerkUserId}@temp.com`;
            let realName = "User";
            let realImageUrl: string | null = null;

            try {
              const clerk = await clerkClient();
              const clerkUser = await clerk.users.getUser(clerkUserId);
              if (clerkUser && clerkUser.emailAddresses.length > 0) {
                realEmail = clerkUser.emailAddresses[0].emailAddress;
                realName =
                  clerkUser.firstName && clerkUser.lastName
                    ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
                    : clerkUser.firstName || clerkUser.lastName || "User";
                realImageUrl = clerkUser.imageUrl || null;
              }
            } catch (clerkError) {
              console.warn(
                "[CHECKOUT] Could not fetch user from Clerk:",
                clerkError
              );
            }

            // Normalize email (lowercase, trim) để đảm bảo matching chính xác
            realEmail = realEmail.toLowerCase().trim();

            console.log("[CHECKOUT] Creating user in database:", {
              clerkUserId,
              email: realEmail,
              name: realName,
            });

            try {
              user = await prisma.user.create({
                data: {
                  clerkId: clerkUserId,
                  email: realEmail,
                  name: realName,
                  imageUrl: realImageUrl,
                  role: "CUSTOMER",
                },
              });
              console.log("[CHECKOUT] User created successfully:", user.id);
            } catch (createError: any) {
              // Nếu user đã tồn tại (race condition), lấy lại từ database
              if (createError.code === "P2002") {
                user = await getUserFromDb(clerkUserId);
                if (user) {
                  console.log(
                    "[CHECKOUT] User already exists, using existing user:",
                    user.id
                  );
                }
              }

              if (!user) {
                console.error("[CHECKOUT] Failed to create user:", createError);
                // Vẫn tiếp tục tạo order như guest nếu không thể tạo user
              }
            }
          } catch (error) {
            console.error("[CHECKOUT] Error creating user:", error);
            // Vẫn tiếp tục tạo order như guest nếu không thể tạo user
          }
        }

        if (user) {
          userId = user.id;
          userEmail = user.email || null;
          console.log("[CHECKOUT] User authenticated:", {
            clerkUserId,
            userId: user.id,
            email: user.email,
          });
        } else {
          console.warn(
            "[CHECKOUT] User not found/created in database for clerkId:",
            clerkUserId,
            "- Order will be created as guest"
          );
        }
      } else {
        console.warn(
          "[CHECKOUT] No Clerk userId found in auth - guest checkout"
        );
      }
    } catch (authError: any) {
      // Nếu không có auth, vẫn cho phép tạo đơn hàng (guest checkout)
      console.warn("[CHECKOUT] Auth error, creating guest order:", {
        error: authError?.message,
        name: authError?.name,
      });
    }

    if (!userId) {
      console.warn("[CHECKOUT] Creating order without userId (guest checkout)");
    }

    // Tạo Order với đầy đủ thông tin
    const orderData: any = {
      storeId: storeId,
      isPaid: false,
      status: "PENDING",
      subtotal,
      tax,
      discount,
      shippingCost,
      total,
      // Lưu shipping address nếu có - ĐẢM BẢO LUÔN LƯU
      // Ưu tiên email từ user đã đăng nhập, sau đó mới dùng email từ shippingAddress
      // Normalize email (lowercase, trim) để đảm bảo matching chính xác
      ...(shippingAddress && shippingAddress.phone && shippingAddress.address
        ? {
            phone: shippingAddress.phone,
            email:
              userEmail || shippingAddress.email || null
                ? (userEmail || shippingAddress.email || "")
                    .toLowerCase()
                    .trim() || null
                : null, // Normalize email for consistent matching
            receiverName: shippingAddress.fullName || null,
            receiverPhone: shippingAddress.phone || null,
            address: `${shippingAddress.address}, ${
              shippingAddress.ward || ""
            }, ${shippingAddress.district || ""}, ${
              shippingAddress.province || ""
            }`.trim(),
            shippingAddress: `${shippingAddress.address}, ${
              shippingAddress.ward || ""
            }, ${shippingAddress.district || ""}, ${
              shippingAddress.province || ""
            }`.trim(),
            city: shippingAddress.province || null,
            postalCode: shippingAddress.ward || null,
            country: "Vietnam",
          }
        : {}),
      // Lưu shipping method
      ...(shippingMethod && {
        shippingMethod: shippingMethod,
      }),
      // Lưu payment method
      ...(paymentMethod && {
        paymentMethod: paymentMethod,
      }),
      // Lưu customer note
      ...(customerNote && {
        customerNote: customerNote,
      }),
    };

    // Thêm userId nếu có
    if (userId) {
      orderData.userId = userId;
      console.log("[CHECKOUT] Linking order to user:", userId);
    }

    // Tạo Order với đầy đủ thông tin
    const order = await prisma.order.create({
      data: {
        ...orderData,
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
              // Lưu image URL từ product images
              imageUrl: product.images?.[0]?.url || null,
            };
          }),
        },
      },
      include: {
        orderItems: true,
      },
    });

    // Log order creation
    console.log("[CHECKOUT] Order created:", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId || "GUEST",
      storeId: order.storeId,
      total: order.total,
      paymentMethod: order.paymentMethod,
      itemCount: order.orderItems?.length || items.length || 0,
    });

    // Nếu là COD, trả về success ngay lập tức
    if (paymentMethod === "COD") {
      return NextResponse.json(
        {
          success: true,
          orderId: order.id,
          message: "Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.",
        },
        {
          headers: corsHeaders,
        }
      );
    }

    // Nếu là MoMo, tạo payment và redirect đến MoMo
    if (paymentMethod === "MOMO") {
      // MoMo không chấp nhận số tiền = 0, chuyển sang COD nếu đơn hàng miễn phí
      if (total <= 0) {
        // Cập nhật order thành COD và isPaid = true
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentMethod: "COD",
            isPaid: true,
            status: "PROCESSING",
          },
        });

        return NextResponse.json(
          {
            success: true,
            orderId: order.id,
            message:
              "Đơn hàng của bạn được miễn phí hoàn toàn! Đơn hàng đã được xác nhận.",
          },
          {
            headers: corsHeaders,
          }
        );
      }

      try {
        const orderInfo = `Đơn hàng #${order.id.slice(-8)}`;
        const momoResponse = await createMoMoPayment(
          order.id,
          Math.round(total),
          orderInfo
        );

        return NextResponse.json(
          {
            success: true,
            orderId: order.id,
            payUrl: momoResponse.payUrl,
            deeplink: momoResponse.deeplink,
            qrCodeUrl: momoResponse.qrCodeUrl,
            message: "Vui lòng thanh toán qua MoMo để hoàn tất đơn hàng.",
          },
          {
            headers: corsHeaders,
          }
        );
      } catch (momoError) {
        console.error("[MOMO_CHECKOUT_ERROR]", momoError);
        // Fallback to order created but payment failed
        return NextResponse.json(
          {
            success: false,
            orderId: order.id,
            error:
              momoError instanceof Error
                ? momoError.message
                : "Không thể tạo thanh toán MoMo",
            message:
              "Đơn hàng đã được tạo nhưng thanh toán MoMo thất bại. Vui lòng liên hệ hỗ trợ.",
          },
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }
    }

    // Nếu là VNPay, tạo payment URL và redirect
    if (paymentMethod === "VNPAY") {
      // VNPay không chấp nhận số tiền = 0, chuyển sang COD nếu đơn hàng miễn phí
      if (total <= 0) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentMethod: "COD",
            isPaid: true,
            status: "PROCESSING",
          },
        });

        return NextResponse.json(
          {
            success: true,
            orderId: order.id,
            message:
              "Đơn hàng của bạn được miễn phí hoàn toàn! Đơn hàng đã được xác nhận.",
          },
          {
            headers: corsHeaders,
          }
        );
      }

      // Validate VNPay configuration
      const tmnCode = process.env.VNPAY_TMN_CODE?.trim();
      const secureSecret = process.env.VNPAY_SECURE_SECRET?.trim();
      
      if (!tmnCode || !secureSecret) {
        console.error("[VNPAY] Missing configuration", {
          hasTmnCode: !!tmnCode,
          hasSecureSecret: !!secureSecret,
          tmnCodeLength: tmnCode?.length,
          secureSecretLength: secureSecret?.length,
        });
        return NextResponse.json(
          {
            success: false,
            message:
              "Thanh toán VNPay chưa được cấu hình. Vui lòng chọn phương thức khác.",
          },
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }
      
      // Log secure secret for debugging (only first and last 2 chars for security)
      console.log("[VNPAY] Secure Secret Info:", {
        length: secureSecret.length,
        firstChars: secureSecret.substring(0, 2),
        lastChars: secureSecret.substring(secureSecret.length - 2),
        expected: "G9Y1BW7S",
        matches: secureSecret === "G9Y1BW7S",
      });

      try {
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

        // testMode should be false for production, true for sandbox
        const testMode = vnpayHost.includes("sandbox");

        // Always log VNPay configuration for debugging
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
          warning: testMode
            ? "⚠️ Using SANDBOX mode - may have JavaScript errors. Use production for production environment."
            : "✅ Using PRODUCTION mode",
        });

        // Initialize VNPay

        const vnpay = new VNPay({
          tmnCode: tmnCode,
          secureSecret: secureSecret,
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

        return NextResponse.json(
          {
            success: true,
            orderId: order.id,
            paymentUrl,
            message: "Vui lòng thanh toán qua VNPay để hoàn tất đơn hàng.",
          },
          {
            headers: corsHeaders,
          }
        );
      } catch (vnpayError) {
        console.error("[VNPAY_CHECKOUT_ERROR]", {
          error: vnpayError,
          orderId: order.id,
          total,
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
          vnpayError instanceof Error
            ? vnpayError.message
            : "Không thể tạo thanh toán VNPay";

        return NextResponse.json(
          {
            success: false,
            orderId: order.id,
            error: errorMessage,
            message:
              "Đơn hàng đã được tạo nhưng thanh toán VNPay thất bại. Vui lòng liên hệ hỗ trợ.",
          },
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }
    }

    // Stripe - Xử lý thanh toán qua thẻ
    // Stripe cũng không chấp nhận số tiền = 0
    if (total <= 0) {
      // Cập nhật order thành COD và isPaid = true
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentMethod: "COD",
          isPaid: true,
          status: "PROCESSING",
        },
      });

      return NextResponse.json(
        {
          success: true,
          orderId: order.id,
          message:
            "Đơn hàng của bạn được miễn phí hoàn toàn! Đơn hàng đã được xác nhận.",
        },
        {
          headers: corsHeaders,
        }
      );
    }

    // Chỉ tạo Stripe session cho các phương thức thanh toán khác
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["VN", "US", "GB", "CA", "AU"], // Cho phép nhiều quốc gia
      },
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
      }/checkout?canceled=1`,
      metadata: {
        orderId: order.id,
        // Lưu shipping address vào metadata để backup
        ...(shippingAddress && {
          shippingFullName: shippingAddress.fullName,
          shippingPhone: shippingAddress.phone,
          shippingAddress: shippingAddress.address,
          shippingProvince: shippingAddress.province,
          shippingDistrict: shippingAddress.district,
          shippingWard: shippingAddress.ward,
        }),
      },
    });

    return NextResponse.json(
      { url: session.url },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[CHECKOUT_PUBLIC_POST_ERROR] Lỗi khi xử lý checkout:",
        error
      );
    }
    const corsHeaders = getCorsHeaders(req);
    return NextResponse.json(
      { message: "Lỗi máy chủ: Xử lý thanh toán thất bại." },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
