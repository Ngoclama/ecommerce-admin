import prisma from "@/lib/prisma";

interface CategoryRevenue {
  name: string;
  value: number;
}

export const getCategoryRevenue = async (
  storeId: string
): Promise<CategoryRevenue[]> => {
  const paidOrders = await prisma.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
    include: {
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
  });

  const categoryRevenue: { [key: string]: number } = {};

  for (const order of paidOrders) {
    for (const item of order.orderItems) {
      const categoryName = item.product.category.name;

      const revenue = (item.productPrice || item.product.price) * item.quantity;

      if (categoryRevenue[categoryName]) {
        categoryRevenue[categoryName] += revenue;
      } else {
        categoryRevenue[categoryName] = revenue;
      }
    }
  }

  const graphData: CategoryRevenue[] = Object.keys(categoryRevenue).map(
    (categoryName) => ({
      name: categoryName,
      value: categoryRevenue[categoryName],
    })
  );

  return graphData;
};
