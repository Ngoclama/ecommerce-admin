import prisma from "@/lib/prisma";

export const revalidate = 0;

const getStockCount = async (storeId: string) => {
  const products = await prisma.product.findMany({
    where: {
      storeId,
      isArchived: false,
    },
    select: {
      inventory: true, 
    },
  });

  const stockCount = products.reduce((total, item) => {
    return total + (item.inventory || 0);
  }, 0);

  return stockCount;
};

export default getStockCount;