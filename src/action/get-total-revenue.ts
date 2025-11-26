import prisma from "@/lib/prisma";

export const getTotalRevenue = async (storeId: string) => {
  const paidOrders = await prisma.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
  });

  // Tính tổng doanh thu từ field total
  const totalRevenue = paidOrders.reduce((total, order) => {
    if (order.total) {
      return total + Number(order.total);
    }
    return total;
  }, 0);

  return totalRevenue;
};
