import prisma from "@/lib/prisma";
import { startOfMonth, subMonths } from "date-fns";

export const getNewStats = async (storeId: string) => {
  const currentMonthStart = startOfMonth(new Date());

  const lastMonthStart = subMonths(currentMonthStart, 1);

  const newUsersCount = await prisma.user.count({
    where: {
      createdAt: {
        gte: currentMonthStart,
      },
    },
  });

  const newProductsCount = await prisma.product.count({
    where: {
      storeId: storeId,
      createdAt: {
        gte: currentMonthStart,
      },
    },
  });

  const totalVIPUsers = await prisma.user.count({
    where: {
      isVIP: true,
    },
  });

  const totalCustomers = await prisma.user.count();
  const nonVIPUsers = totalCustomers - totalVIPUsers;

  const userDistribution = [
    { name: "VIP Users", value: totalVIPUsers },
    { name: "Standard Users", value: nonVIPUsers },
  ];

  const productsByCategory = await prisma.category.findMany({
    where: {
      storeId: storeId,
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  const productDistribution = productsByCategory
    .map((c) => ({
      name: c.name,
      value: c._count.products,
    }))
    .filter((c) => c.value > 0);

  return {
    newUsersCount,
    newProductsCount,
    totalVIPUsers,
    userDistribution,
    productDistribution,
  };
};
