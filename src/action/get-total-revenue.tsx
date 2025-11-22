import prisma from "@/lib/prisma";

export const revalidate = 0;

const getTotalRevenue = async (storeId: string) => {
  const paidOrders = await prisma.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  const totalRevenue = paidOrders.reduce((total, order) => {
    const orderTotal = order.orderItems.reduce((orderSum, item) => {
      const price = item.productPrice ?? item.product.price;
      return orderSum + Number(price) * item.quantity;
    }, 0);
    return total + orderTotal;
  }, 0);

  return totalRevenue;
};

export default getTotalRevenue;
