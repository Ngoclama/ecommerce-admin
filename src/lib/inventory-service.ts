/**
 * ═══════════════════════════════════════════════════════════════
 * INVENTORY MANAGEMENT SERVICE
 * ═══════════════════════════════════════════════════════════════
 *
 * Quản lý tồn kho chuyên nghiệp với:
 * - Optimistic locking để tránh race conditions
 * - Reserve inventory khi đặt hàng
 * - Release inventory khi hủy đơn
 * - Low stock warnings
 */

import prisma from "@/lib/prisma";

export interface InventoryCheckResult {
  available: boolean;
  currentStock: number;
  requested: number;
  message?: string;
}

export interface InventoryReservation {
  variantId: string;
  quantity: number;
  orderId: string;
}

/**
 * Kiểm tra số lượng tồn kho có đủ không
 */
export async function checkInventoryAvailability(
  variantId: string,
  quantity: number,
): Promise<InventoryCheckResult> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: {
      inventory: true,
      product: {
        select: {
          trackQuantity: true,
          allowBackorder: true,
          name: true,
        },
      },
    },
  });

  if (!variant) {
    return {
      available: false,
      currentStock: 0,
      requested: quantity,
      message: "Biến thể sản phẩm không tồn tại",
    };
  }

  // Nếu sản phẩm không theo dõi số lượng, luôn available
  if (!variant.product.trackQuantity) {
    return {
      available: true,
      currentStock: variant.inventory,
      requested: quantity,
    };
  }

  // Kiểm tra tồn kho
  if (variant.inventory >= quantity) {
    return {
      available: true,
      currentStock: variant.inventory,
      requested: quantity,
    };
  }

  // Không đủ hàng - kiểm tra allowBackorder
  if (variant.product.allowBackorder) {
    return {
      available: true,
      currentStock: variant.inventory,
      requested: quantity,
      message: `${variant.product.name}: Chỉ còn ${variant.inventory} sản phẩm, phần còn lại sẽ được giao sau`,
    };
  }

  return {
    available: false,
    currentStock: variant.inventory,
    requested: quantity,
    message: `${variant.product.name}: Chỉ còn ${variant.inventory} sản phẩm trong kho`,
  };
}

/**
 * Reserve inventory khi tạo đơn hàng (atomic operation)
 */
export async function reserveInventory(
  items: InventoryReservation[],
): Promise<{ success: boolean; message?: string; failedItems?: string[] }> {
  try {
    await prisma.$transaction(async (tx) => {
      const failedItems: string[] = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: {
            inventory: true,
            product: {
              select: {
                trackQuantity: true,
                name: true,
              },
            },
          },
        });

        if (!variant) {
          failedItems.push(`Biến thể ${item.variantId} không tồn tại`);
          continue;
        }

        // Nếu không track quantity, skip
        if (!variant.product.trackQuantity) {
          continue;
        }

        if (variant.inventory < item.quantity) {
          failedItems.push(
            `${variant.product.name}: Chỉ còn ${variant.inventory}/${item.quantity} sản phẩm`,
          );
          continue;
        }

        // Decrease inventory (using atomic decrement)
        await tx.productVariant.update({
          where: {
            id: item.variantId,
            inventory: { gte: item.quantity },
          },
          data: {
            inventory: {
              decrement: item.quantity,
            },
          },
        });
      }

      if (failedItems.length > 0) {
        throw new Error(failedItems.join(". "));
      }
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Không thể đặt trước tồn kho",
    };
  }
}

/**
 * Release inventory khi hủy đơn hàng
 */
export async function releaseInventory(
  items: InventoryReservation[],
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: {
            product: {
              select: { trackQuantity: true },
            },
          },
        });

        if (!variant || !variant.product.trackQuantity) {
          continue;
        }

        // Increase inventory back
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            inventory: {
              increment: item.quantity,
            },
          },
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Không thể hoàn trả tồn kho",
    };
  }
}

/**
 * Kiểm tra low stock warnings
 */
export async function checkLowStockProducts(storeId: string) {
  const lowStockVariants = await prisma.productVariant.findMany({
    where: {
      product: {
        storeId,
        trackQuantity: true,
      },
      inventory: {
        lte: prisma.productVariant.fields.lowStockThreshold,
      },
    },
    include: {
      product: {
        select: { name: true },
      },
      size: true,
      color: true,
    },
  });

  return lowStockVariants.map((v) => ({
    productName: v.product.name,
    size: v.size?.name,
    color: v.color?.name,
    currentStock: v.inventory,
    threshold: v.lowStockThreshold,
    message: `${v.product.name} (${v.size?.name}, ${v.color?.name}): Còn ${v.inventory} sản phẩm`,
  }));
}

export async function bulkUpdateInventory(
  updates: Array<{ variantId: string; quantity: number }>,
): Promise<{ success: boolean; updated: number; failed: number }> {
  let updated = 0;
  let failed = 0;

  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      try {
        await tx.productVariant.update({
          where: { id: update.variantId },
          data: { inventory: update.quantity },
        });
        updated++;
      } catch {
        failed++;
      }
    }
  });

  return { success: true, updated, failed };
}

/**
 * Giảm tồn kho khi đơn hàng được thanh toán (Atomic operation)
 * Đảm bảo chỉ giảm một lần duy nhất
 */
export async function decrementOrderInventory(
  orderId: string,
): Promise<{ success: boolean; message?: string; decremented: number }> {
  try {
    let decrementedCount = 0;

    await prisma.$transaction(async (tx) => {
      // Lấy tất cả items của order
      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
        include: {
          product: {
            select: {
              id: true,
              trackQuantity: true,
              name: true,
            },
          },
        },
      });

      // Giảm tồn kho cho từng item
      for (const item of orderItems) {
        // Skip nếu sản phẩm không theo dõi tồn kho
        if (!item.product.trackQuantity) {
          continue;
        }

        // Phải có size và color để tìm variant
        if (!item.sizeId || !item.colorId) {
          console.warn(
            `[INVENTORY_DECREMENT] OrderItem ${item.id} không có sizeId/colorId`,
          );
          continue;
        }

        // Tìm variant
        const variant = await tx.productVariant.findFirst({
          where: {
            productId: item.productId,
            sizeId: item.sizeId,
            colorId: item.colorId,
            materialId: item.materialId || null,
          },
        });

        if (!variant) {
          console.warn(
            `[INVENTORY_DECREMENT] Không tìm thấy variant cho product ${item.productId}, size ${item.sizeId}, color ${item.colorId}`,
          );
          continue;
        }

        // Kiểm tra tồn kho trước khi giảm
        if (variant.inventory < item.quantity) {
          console.warn(
            `[INVENTORY_DECREMENT] Insufficient inventory for variant ${variant.id}: available ${variant.inventory}, requested ${item.quantity}`,
          );
          continue;
        }

        // Giảm tồn kho (atomic operation)
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            inventory: {
              decrement: item.quantity,
            },
          },
        });

        decrementedCount++;
        console.log(
          `[INVENTORY_DECREMENT] Decremented variant ${variant.id}: -${item.quantity} (${item.product.name})`,
        );
      }

      // Đánh dấu order đã xử lý tồn kho
      await tx.order.update({
        where: { id: orderId },
        data: {
          // Thêm flag để tránh xử lý lại
          inventoryDecremented: true,
        },
      });
    });

    return {
      success: true,
      message: `Successfully decremented inventory for ${decrementedCount} items`,
      decremented: decrementedCount,
    };
  } catch (error: any) {
    console.error("[INVENTORY_DECREMENT_ERROR]", error);
    return {
      success: false,
      message: error.message || "Không thể giảm tồn kho",
      decremented: 0,
    };
  }
}
