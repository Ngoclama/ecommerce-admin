import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Order Service
 * Professional backend service layer for order operations
 * Follows SOLID principles and best practices
 */

export type PaymentMethod = "COD" | "STRIPE" | "MOMO" | "VNPAY";
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface CreateOrderItem {
  productId: string;
  variantId?: string;
  sizeId?: string;
  colorId?: string;
  materialId?: string;
  quantity: number;
}

export interface CreateOrderData {
  storeId: string;
  userId?: string | null;
  items: CreateOrderItem[];
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    province?: string;
    district?: string;
    ward?: string;
  };
  shippingMethod?: string;
  paymentMethod: PaymentMethod;
  coupon?: {
    code: string;
    value: number;
    type: "PERCENT" | "FIXED";
  } | null;
  customerNote?: string | null;
}

export interface OrderCalculationResult {
  subtotal: number;
  tax: number;
  discount: number;
  shippingCost: number;
  total: number;
}

export class OrderService {
  /**
   * Determine if payment method requires immediate payment
   * Online payments (STRIPE, MOMO, VNPAY) = paid immediately
   * COD = not paid until delivery
   */
  private isOnlinePayment(paymentMethod: PaymentMethod): boolean {
    return paymentMethod !== "COD";
  }

  /**
   * Calculate order totals
   */
  async calculateOrderTotals(
    items: CreateOrderItem[],
    shippingCost: number = 0,
    coupon?: { value: number; type: "PERCENT" | "FIXED" } | null
  ): Promise<OrderCalculationResult> {
    try {
      // Fetch all products
      const productIds = items.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          variants: {
            include: {
              size: true,
              color: true,
              material: true,
            },
          },
        },
      });

      // Calculate subtotal
      let subtotal = 0;
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        // Find variant
        let variant = null;
        if (item.variantId) {
          variant = product.variants.find((v) => v.id === item.variantId);
        } else if (item.sizeId && item.colorId) {
          variant = product.variants.find(
            (v) =>
              v.sizeId === item.sizeId &&
              v.colorId === item.colorId &&
              (!item.materialId || v.materialId === item.materialId)
          );
        }

        const itemPrice = variant?.price
          ? Number(variant.price)
          : Number(product.price);

        subtotal += itemPrice * item.quantity;
      }

      // Calculate tax (10% VAT)
      const tax = subtotal * 0.1;

      // Calculate discount
      let discount = 0;
      if (coupon) {
        if (coupon.type === "PERCENT") {
          discount = (subtotal + tax) * (coupon.value / 100);
        } else {
          discount = coupon.value;
        }
        // Ensure discount doesn't exceed total
        discount = Math.min(discount, subtotal + tax);
      }

      // Calculate total
      const total = Math.max(0, subtotal + tax + shippingCost - discount);

      return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        total: Math.round(total * 100) / 100,
      };
    } catch (error) {
      console.error("[ORDER_SERVICE] Error calculating totals:", error);
      throw new Error("Failed to calculate order totals");
    }
  }

  /**
   * Create a new order
   * Sets isPaid = true for online payments, false for COD
   */
  async createOrder(data: CreateOrderData): Promise<any> {
    try {
      const {
        storeId,
        userId,
        items,
        shippingAddress,
        shippingMethod,
        paymentMethod,
        coupon,
        customerNote,
      } = data;

      // Validate store exists
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });

      if (!store) {
        throw new Error("Store not found");
      }

      // Fetch products for validation and pricing
      const productIds = items.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          variants: {
            include: {
              size: true,
              color: true,
              material: true,
            },
          },
          images: {
            take: 1,
          },
        },
      });

      // Validate all products exist
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
      }

      // Calculate shipping cost (can be enhanced with shipping method logic)
      const shippingCost = 0; // Default, can be calculated based on shippingMethod

      // Calculate totals
      const totals = await this.calculateOrderTotals(
        items,
        shippingCost,
        coupon
      );

      // Determine payment status
      // Online payments (STRIPE, MOMO, VNPAY) = paid immediately when order is created
      // COD = not paid until delivery
      const isPaid = this.isOnlinePayment(paymentMethod);

      // Normalize email
      const normalizedEmail = shippingAddress?.email
        ? shippingAddress.email.toLowerCase().trim()
        : null;

      // Build order data
      const orderData: Prisma.OrderCreateInput = {
        store: { connect: { id: storeId } },
        isPaid,
        status: isPaid ? "PROCESSING" : "PENDING", // Online payments start as PROCESSING
        paymentMethod,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: totals.discount,
        shippingCost: totals.shippingCost,
        total: totals.total,
        ...(coupon && { couponCode: coupon.code }),
        ...(shippingMethod && { shippingMethod }),
        ...(customerNote && { customerNote }),
        ...(userId && { user: { connect: { id: userId } } }),
        ...(shippingAddress && {
          phone: shippingAddress.phone || "",
          email: normalizedEmail,
          receiverName: shippingAddress.fullName || null,
          receiverPhone: shippingAddress.phone || null,
          address: shippingAddress.address
            ? `${shippingAddress.address}, ${shippingAddress.ward || ""}, ${
                shippingAddress.district || ""
              }, ${shippingAddress.province || ""}`.trim()
            : "",
          shippingAddress: shippingAddress.address
            ? `${shippingAddress.address}, ${shippingAddress.ward || ""}, ${
                shippingAddress.district || ""
              }, ${shippingAddress.province || ""}`.trim()
            : null,
          city: shippingAddress.province || null,
          postalCode: shippingAddress.ward || null,
          country: "Vietnam",
        }),
        orderItems: {
          create: items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;

            // Find variant
            let variant = null;
            if (item.variantId) {
              variant = product.variants.find((v) => v.id === item.variantId);
            } else if (item.sizeId && item.colorId) {
              variant = product.variants.find(
                (v) =>
                  v.sizeId === item.sizeId &&
                  v.colorId === item.colorId &&
                  (!item.materialId || v.materialId === item.materialId)
              );
            }

            const itemPrice = variant?.price
              ? Number(variant.price)
              : Number(product.price);

            return {
              product: { connect: { id: item.productId } },
              sizeId: variant?.sizeId || item.sizeId || null,
              colorId: variant?.colorId || item.colorId || null,
              materialId: variant?.materialId || item.materialId || null,
              sizeName: variant?.size?.name || null,
              colorName: variant?.color?.name || null,
              materialName: variant?.material?.name || null,
              productPrice: itemPrice,
              price: itemPrice,
              productName: product.name,
              quantity: item.quantity,
              imageUrl: product.images?.[0]?.url || null,
            };
          }),
        },
      };

      // Create order
      const order = await prisma.order.create({
        data: orderData,
        include: {
          orderItems: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      // If order is paid (online payment), decrement inventory
      if (isPaid) {
        await this.decrementInventory(order.id);
      }

      return order;
    } catch (error) {
      console.error("[ORDER_SERVICE] Error creating order:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new Error("Order number already exists");
        }
      }
      throw error instanceof Error
        ? error
        : new Error("Failed to create order");
    }
  }

  /**
   * Decrement product inventory after successful payment
   */
  async decrementInventory(orderId: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true,
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Decrement inventory for each order item
      for (const item of order.orderItems) {
        if (item.sizeId && item.colorId) {
          // Find variant based on snapshot data
          const variant = await prisma.productVariant.findFirst({
            where: {
              productId: item.productId,
              sizeId: item.sizeId,
              colorId: item.colorId,
              materialId: item.materialId || null,
            },
          });

          if (variant) {
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: {
                inventory: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      }
    } catch (error) {
      console.error("[ORDER_SERVICE] Error decrementing inventory:", error);
      // Don't throw - inventory update failure shouldn't fail order creation
    }
  }

  /**
   * Update order payment status
   */
  async updatePaymentStatus(
    orderId: string,
    isPaid: boolean,
    transactionId?: string
  ): Promise<any> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          isPaid,
          ...(transactionId && { transactionId }),
          ...(isPaid && { status: "PROCESSING" }),
        },
        include: {
          orderItems: true,
        },
      });

      // If payment successful, decrement inventory
      if (isPaid && !order.isPaid) {
        await this.decrementInventory(orderId);
      }

      return order;
    } catch (error) {
      console.error("[ORDER_SERVICE] Error updating payment status:", error);
      throw new Error("Failed to update payment status");
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(
    orderId: string,
    includeItems: boolean = true
  ): Promise<any> {
    try {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: includeItems
            ? {
                include: {
                  product: {
                    include: {
                      images: true,
                    },
                  },
                },
              }
            : false,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("[ORDER_SERVICE] Error fetching order:", error);
      throw new Error("Failed to fetch order");
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<any> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Can only cancel PENDING or PROCESSING orders
      if (!["PENDING", "PROCESSING"].includes(order.status)) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

      return await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          ...(reason && { adminNote: reason }),
        },
      });
    } catch (error) {
      console.error("[ORDER_SERVICE] Error cancelling order:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to cancel order");
    }
  }

  /**
   * Delete unpaid pending order (for payment cancellation)
   */
  async deleteUnpaidOrder(orderId: string): Promise<boolean> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return false;
      }

      // Only delete if unpaid and pending
      if (order.isPaid || order.status !== "PENDING") {
        return false;
      }

      await prisma.order.delete({
        where: { id: orderId },
      });

      return true;
    } catch (error) {
      console.error("[ORDER_SERVICE] Error deleting order:", error);
      return false;
    }
  }

  /**
   * Link order to user by email
   */
  async linkOrderToUser(orderId: string, email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: email }, { email: normalizedEmail }],
        },
      });

      if (!user) {
        return false;
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.userId) {
        return false;
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          userId: user.id,
        },
      });

      return true;
    } catch (error) {
      console.error("[ORDER_SERVICE] Error linking order to user:", error);
      return false;
    }
  }
}

// Export singleton instance
export const orderService = new OrderService();
