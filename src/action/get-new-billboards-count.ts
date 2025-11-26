import prisma from "@/lib/prisma";
import { startOfMonth } from "date-fns";

// Lấy số lượng billboard mới trong tháng hiện tại
export const getNewBillboardsCount = async (storeId: string) => {
  const currentMonthStart = startOfMonth(new Date());

  const newBillboardsCount = await prisma.billboard.count({
    where: {
      storeId: storeId,
      createdAt: {
        gte: currentMonthStart,
      },
    },
  });

  return newBillboardsCount;
};
