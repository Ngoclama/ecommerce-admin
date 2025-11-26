import { format, subDays, startOfDay, endOfDay } from "date-fns";
import prisma from "@/lib/prisma";
import { ReportsClient } from "./components/client";

const ReportsPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) => {
  const { storeId } = await params;
  const { startDate: startDateParam, endDate: endDateParam } =
    await searchParams;

  // Get date range from query params or default to last 30 days
  const endDate = endDateParam
    ? endOfDay(new Date(endDateParam))
    : endOfDay(new Date());
  const startDate = startDateParam
    ? startOfDay(new Date(startDateParam))
    : startOfDay(subDays(endDate, 30));

  // Get orders in date range
  const orders = await prisma.order.findMany({
    where: {
      storeId: storeId,
      isPaid: true,
      createdAt: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate statistics
  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.total || 0),
    0
  );
  const totalOrders = orders.length;
  const totalItems = orders.reduce(
    (sum, order) =>
      sum + order.orderItems.reduce((s, item) => s + item.quantity, 0),
    0
  );

  // Top products
  const productSales: Record<
    string,
    { name: string; quantity: number; revenue: number }
  > = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const productId = item.productId;
      const productName = item.productName || item.product.name;
      const quantity = item.quantity;
      const revenue = (item.productPrice || item.product.price) * quantity;

      if (!productSales[productId]) {
        productSales[productId] = {
          name: productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[productId].quantity += quantity;
      productSales[productId].revenue += revenue;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Category revenue
  const categoryRevenue: Record<string, number> = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const categoryName = item.product.category.name;
      const revenue = (item.productPrice || item.product.price) * item.quantity;
      categoryRevenue[categoryName] =
        (categoryRevenue[categoryName] || 0) + revenue;
    });
  });

  const reportData = {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    summary: {
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    },
    topProducts,
    categoryRevenue: Object.entries(categoryRevenue).map(([name, value]) => ({
      name,
      value,
    })),
    orders: orders.map((order) => ({
      id: order.id,
      date: format(order.createdAt, "yyyy-MM-dd"),
      total: order.total,
      items: order.orderItems.length,
      status: order.status,
    })),
  };

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ReportsClient data={reportData} />
      </div>
    </div>
  );
};

export default ReportsPage;
