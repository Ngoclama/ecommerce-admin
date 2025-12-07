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
  quantity: number
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
  items: InventoryReservation[]
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

        // Check sufficient stock
        if (variant.inventory < item.quantity) {
          failedItems.push(
            `${variant.product.name}: Chỉ còn ${variant.inventory}/${item.quantity} sản phẩm`
          );
          continue;
        }

        // Decrease inventory (using atomic decrement)
        await tx.productVariant.update({
          where: {
            id: item.variantId,
            inventory: { gte: item.quantity }, // Optimistic lock
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
  items: InventoryReservation[]
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

/**
 * Bulk update inventory (cho admin import)
 */
export async function bulkUpdateInventory(
  updates: Array<{ variantId: string; quantity: number }>
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
