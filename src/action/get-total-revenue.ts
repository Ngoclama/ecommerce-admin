import prisma from "@/lib/prisma";

export const getTotalRevenue = async (storeId: string) => {
  const paidOrders = await prisma.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
    include: {
      orderItems: true,
    },
  });

  const totalRevenue = paidOrders.reduce((total, order) => {
    const orderTotal = order.orderItems.reduce((orderSum, item) => {
      return orderSum + (item.productPrice || 0) * item.quantity;
    }, 0);
    return total + orderTotal;
  }, 0);

  return totalRevenue;
};
