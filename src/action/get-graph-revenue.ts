import prisma from "@/lib/prisma";

interface GraphData {
  name: string;
  total: number;
}

export const getGraphRevenue = async (
  storeId: string
): Promise<GraphData[]> => {
  const paidOrders = await prisma.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
  });

  const monthlyRevenue: { [key: number]: number } = {};

  for (let i = 0; i < 12; i++) {
    monthlyRevenue[i] = 0;
  }

  for (const order of paidOrders) {
    const month = order.createdAt.getMonth();
    // Sử dụng total field
    const revenueForOrder = order.total ? Number(order.total) : 0;

    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenueForOrder;
  }

  const graphData: GraphData[] = [
    { name: "T1", total: monthlyRevenue[0] || 0 },
    { name: "T2", total: monthlyRevenue[1] || 0 },
    { name: "T3", total: monthlyRevenue[2] || 0 },
    { name: "T4", total: monthlyRevenue[3] || 0 },
    { name: "T5", total: monthlyRevenue[4] || 0 },
    { name: "T6", total: monthlyRevenue[5] || 0 },
    { name: "T7", total: monthlyRevenue[6] || 0 },
    { name: "T8", total: monthlyRevenue[7] || 0 },
    { name: "T9", total: monthlyRevenue[8] || 0 },
    { name: "T10", total: monthlyRevenue[9] || 0 },
    { name: "T11", total: monthlyRevenue[10] || 0 },
    { name: "T12", total: monthlyRevenue[11] || 0 },
  ];

  return graphData;
};
