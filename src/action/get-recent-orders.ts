import prisma from "@/lib/prisma";

export const getRecentOrders = async (storeId: string) => {
  const recentOrders = await prisma.order.findMany({
    where: {
      storeId,
    },
    include: {
      user: true,
      orderItems: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return recentOrders;
};
