import prisma from "@/lib/prisma";

export const revalidate = 0;

const getSalesCount = async (storeId: string) => {
  const salesCount = await prisma.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
  });
  return salesCount.length;
};

export default getSalesCount;
