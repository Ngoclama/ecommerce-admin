import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface OrderItemInput {
  productId: string;
  variantId: string;
  productName: string;
  quantity: number;
  price: number;
}

/**
 * POST /api/orders
 * Tạo order từ cart items và trừ tồn kho
 * Được gọi TRƯỚC khi thanh toán
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      storeId,
      orderItems, // Array of { productId, variantId, sizeId, colorId, quantity, price, productName }
      shippingAddress,
      phoneNumber,
      email,
      paymentMethod,
    } = body;

    if (!userId || !storeId || !orderItems || orderItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order data - missing userId, storeId or items",
        },
        { status: 400 },
      );
    }

    // Convert Clerk ID to MongoDB ID
    let mongoDbUserId = userId;
    try {
      // userId từ store là Clerk ID (format: user_xxx)
      // Cần query User table để lấy MongoDB ID
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        console.error(
          `[ORDER_CREATE] ❌ User not found with clerkId: ${userId}`,
        );
        return NextResponse.json(
          {
            success: false,
            message: "User not found",
          },
          { status: 404 },
        );
      }

      mongoDbUserId = user.id;
      console.log(
        `[ORDER_CREATE] Converted Clerk ID ${userId} to MongoDB ID ${mongoDbUserId}`,
      );
    } catch (error) {
      console.error("[ORDER_CREATE] Error converting userId:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to convert user ID",
        },
        { status: 400 },
      );
    }

    // Tạo order trong transaction (atomic)
    const order = await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra và trừ tồn kho cho mỗi item
      console.log(`[ORDER_CREATE] Processing ${orderItems.length} items`);

      interface ResolvedItem extends OrderItemInput {
        resolvedVariantId: string;
        sizeId?: string;
        colorId?: string;
        materialId?: string;
        sizeName?: string;
        colorName?: string;
        materialName?: string;
      }

      const resolvedItems: ResolvedItem[] = [];

      for (const item of orderItems as OrderItemInput[]) {
        let variantId = item.variantId;

        console.log(
          `[ORDER_CREATE] Processing item: ${item.productName} (productId: ${item.productId}, variantId: ${variantId})`,
        );

        // Nếu không có variantId, lấy variant đầu tiên của product
        if (!variantId || variantId.trim() === "") {
          console.log(
            `[ORDER_CREATE] No variantId provided, looking for first variant of product ${item.productId}`,
          );

          const firstVariant = await tx.productVariant.findFirst({
            where: { productId: item.productId },
            select: { id: true },
          });

          if (!firstVariant) {
            console.error(
              `[ORDER_CREATE] ❌ No variant found for product: ${item.productId}`,
            );
            throw new Error(
              `No variant found for product ${item.productId}. Product must have at least one variant.`,
            );
          }

          variantId = firstVariant.id;
          console.log(`[ORDER_CREATE] Using first variant: ${variantId}`);
        }

        // Tìm variant
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: {
            id: true,
            inventory: true,
            product: true,
            sizeId: true,
            colorId: true,
            materialId: true,
            size: { select: { name: true } },
            color: { select: { name: true } },
            material: { select: { name: true } },
          },
        });

        if (!variant) {
          console.error(`[ORDER_CREATE] ❌ Variant not found: ${variantId}`);
          throw new Error(`Variant not found: ${variantId}`);
        }

        console.log(
          `[ORDER_CREATE] Found variant: ${variantId}, inventory: ${variant.inventory}, requested: ${item.quantity}`,
        );

        // Kiểm tra tồn kho
        if (variant.inventory < item.quantity) {
          console.error(
            `[ORDER_CREATE] ❌ Insufficient inventory for ${item.productName}`,
          );
          throw new Error(
            `${item.productName} hiện chỉ còn ${variant.inventory} sản phẩm, không thể đặt ${item.quantity} sản phẩm.`,
          );
        }

        // Trừ tồn kho
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            inventory: {
              decrement: item.quantity,
            },
          },
        });

        console.log(
          `[ORDER_CREATE] ✅ Decremented ${item.productName}: -${item.quantity}`,
        );

        // Lưu resolved info
        resolvedItems.push({
          ...item,
          resolvedVariantId: variantId,
          sizeId: variant.sizeId || undefined,
          colorId: variant.colorId || undefined,
          materialId: variant.materialId || undefined,
          sizeName: variant.size?.name,
          colorName: variant.color?.name,
          materialName: variant.material?.name,
        });
      }

      // 2. Tạo order
      const newOrder = await tx.order.create({
        data: {
          userId: mongoDbUserId,
          storeId,
          orderNumber: `ORD-${Date.now()}`,
          isPaid: false,
          inventoryDecremented: true, // 👈 Mark as decremented (already done above)
          status: "PENDING",
          paymentMethod,
          shippingAddress,
          phone: phoneNumber,
          email,
          orderItems: {
            create: resolvedItems.map((item) => {
              // Find variant to get size/color/material details
              const variant = resolvedItems.find((ri) => ri.resolvedVariantId)
                ? resolvedItems
                    .map((ri) => ({
                      variantId: ri.resolvedVariantId,
                      sizeId: "",
                      colorId: "",
                      materialId: "",
                    }))
                    .find((v) => v.variantId)
                : null;

              return {
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                productName: item.productName,
                productPrice: item.price,
                sizeId: item.sizeId,
                colorId: item.colorId,
                materialId: item.materialId,
                sizeName: item.sizeName,
                colorName: item.colorName,
                materialName: item.materialName,
              };
            }),
          },
        },
        include: {
          orderItems: true,
        },
      });

      console.log(
        `[ORDER_CREATE] ✅ Order created: ${newOrder.orderNumber} with ${orderItems.length} items`,
      );

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: "Order created successfully, inventory decremented",
    });
  } catch (error) {
    console.error("[ORDER_CREATE] ❌ Error:", error);

    // Log chi tiết lỗi
    if (error instanceof Error) {
      console.error("[ORDER_CREATE] Error message:", error.message);
      console.error("[ORDER_CREATE] Error stack:", error.stack);
    }

    const message =
      error instanceof Error ? error.message : "Failed to create order";

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
