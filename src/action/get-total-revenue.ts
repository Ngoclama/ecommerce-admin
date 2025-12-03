import prisma from "@/lib/prisma";

export const getTotalRevenue = async (storeId: string) => {
  // Sử dụng aggregate để tính tổng trực tiếp trên DB, tránh phải load toàn bộ đơn hàng
  const result = await prisma.order.aggregate({
    where: {
      storeId,
      isPaid: true,
    },
    _sum: {
      total: true,
    },
  });

  const sum = result._sum?.total ?? 0;
  return Number(sum) || 0;
};
