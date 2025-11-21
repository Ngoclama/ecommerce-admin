import prisma from "@/lib/prisma";

export const revalidate = 0;

const getStockCount = async (storeId: string) => {
  const stockCount = await prisma.product.findMany({
    where: {
      storeId,
      isArchived: false,
    },
  });
  return stockCount.length;
};

export default getStockCount;
