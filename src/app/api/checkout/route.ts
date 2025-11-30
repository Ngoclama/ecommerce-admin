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
      console.log("[CHECKOUT_PUBLIC_POST] Phương thức giao hàng:", shippingMethod);
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { message: "Vui lòng thêm sản phẩm vào giỏ hàng." },
        { status: 400 }
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
        }
      );
    }

    // Lấy storeId từ product đầu tiên (tất cả products phải cùng store)
    const storeId = products[0]?.storeId;
    if (!storeId) {
      return NextResponse.json(
        { message: "Không tìm thấy cửa hàng." },
        { status: 400 }
      );
    }

    // Kiểm tra tất cả products có cùng storeId
    const allSameStore = products.every((p) => p.storeId === storeId);
    if (!allSameStore) {
      return NextResponse.json(
        { message: "Tất cả sản phẩm phải từ cùng một cửa hàng." },
        {
          status: 400,
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
          return NextResponse.json(
            {
              message: `Sản phẩm '${product.name}' (${variant.size.name}/${variant.color.name}) chỉ còn ${variant.inventory} cái.`,
            },
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
          return NextResponse.json(
            {
              message: `Sản phẩm '${product.name}' chỉ còn ${totalInventory} cái.`,
            },
            { status: 400 }
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
        // Lưu shipping address nếu có - ĐẢM BẢO LUÔN LƯU
        ...(shippingAddress && shippingAddress.phone && shippingAddress.address
          ? {
              phone: shippingAddress.phone,
              email: shippingAddress.email || null,
              address: `${shippingAddress.address}, ${
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

    // Nếu là COD, trả về success ngay lập tức
    if (paymentMethod === "COD") {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        message: "Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.",
      });
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
      }/checkout?success=1`,
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

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[CHECKOUT_PUBLIC_POST_ERROR] Lỗi khi xử lý checkout:", error);
    }
    return NextResponse.json(
      { message: "Lỗi máy chủ: Xử lý thanh toán thất bại." },
      { status: 500 }
    );
  }
}
