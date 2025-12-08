import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

export const getOptimizedProduct = async (productId: string) => {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        include: {
          size: true,
          color: true,
          material: true,
        },
      },
      images: true,
      category: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });
};

export const getOptimizedProducts = async (
  storeId: string,
  skip: number = 0,
  take: number = 20
) => {
  return prisma.product.findMany({
    where: { storeId, isPublished: true, isArchived: false },
    include: {
      category: true,
      images: {
        take: 1,
      },
      variants: {
        take: 1,
        select: {
          price: true,
          inventory: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
};

export const getOptimizedOrder = async (orderId: string) => {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              images: { take: 1 },
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
        },
      },
      shippings: true,
      returns: true,
    },
  });
};

/**
 * Batch Fetch Products by IDs
 */
export const getOptimizedProductsByIds = async (productIds: string[]) => {
  if (!productIds.length) return [];

  return prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      images: { take: 1 },
      variants: {
        take: 1,
        select: { price: true, inventory: true },
      },
      category: true,
    },
  });
};

export const getOptimizedCategories = async (storeId: string) => {
  return prisma.category.findMany({
    where: { storeId },
    include: {
      _count: {
        select: { products: true },
      },
      children: {
        include: {
          _count: {
            select: { products: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export default prisma;
