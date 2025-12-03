import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  differenceInDays,
} from "date-fns";
import prisma from "@/lib/prisma";
import { ReportsClient } from "./components/client";
import type { Prisma } from "@prisma/client";

const ReportsPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    period?: "custom" | "week" | "month" | "quarter";
    categoryId?: string;
    productId?: string;
  }>;
}) => {
  const { storeId } = await params;
  const {
    startDate: startDateParam,
    endDate: endDateParam,
    period,
    categoryId,
    productId,
  } = await searchParams;

  // Calculate date range based on period
  let endDate: Date;
  let startDate: Date;

  if (period === "week") {
    endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
    startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  } else if (period === "month") {
    endDate = endOfMonth(new Date());
    startDate = startOfMonth(new Date());
  } else if (period === "quarter") {
    endDate = endOfQuarter(new Date());
    startDate = startOfQuarter(new Date());
  } else {
    // Custom or default to last 30 days
    endDate = endDateParam
      ? endOfDay(new Date(endDateParam))
      : endOfDay(new Date());
    startDate = startDateParam
      ? startOfDay(new Date(startDateParam))
      : startOfDay(subDays(endDate, 30));
  }

  // Calculate previous period for comparison
  const daysDiff = differenceInDays(endDate, startDate) || 1;
  const prevEndDate = startOfDay(startDate);
  const prevStartDate = startOfDay(subDays(prevEndDate, daysDiff));

  // Build where clause with filters
  const whereClause: Prisma.OrderWhereInput = {
    storeId: storeId,
    isPaid: true,
    createdAt: {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    },
  };

  // Add category/product filters if specified
  if (categoryId || productId) {
    whereClause.orderItems = {
      some: {
        ...(productId ? { productId } : {}),
        ...(categoryId
          ? {
              product: {
                categoryId,
              },
            }
          : {}),
      },
    };
  }

  // Get current period orders
  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      orderItems: {
        include: {
          product: {
            include: { category: true },
          },
        },
      },
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get previous period orders for comparison
  const prevOrders = await prisma.order.findMany({
    where: {
      ...whereClause,
      createdAt: {
        gte: prevStartDate,
        lte: prevEndDate,
      },
    },
    include: {
      orderItems: {
        include: {
          product: {
            include: { category: true },
          },
        },
      },
      user: true,
    },
  });

  // Calculate statistics (current)
  const totalRevenue = orders.reduce(
    (sum: number, order) => sum + (order.total || 0),
    0
  );
  const totalOrders = orders.length;
  const totalItems = orders.reduce(
    (sum: number, order) =>
      sum + order.orderItems.reduce((s: number, item) => s + item.quantity, 0),
    0
  );

  // Calculate statistics (previous)
  const prevTotalRevenue = prevOrders.reduce(
    (sum: number, order) => sum + (order.total || 0),
    0
  );
  const prevTotalOrders = prevOrders.length;
  const prevTotalItems = prevOrders.reduce(
    (sum: number, order) =>
      sum + order.orderItems.reduce((s: number, item) => s + item.quantity, 0),
    0
  );

  // Calculate percentage changes
  const revenueChange =
    prevTotalRevenue > 0
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
      : 0;
  const ordersChange =
    prevTotalOrders > 0
      ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100
      : 0;
  const itemsChange =
    prevTotalItems > 0
      ? ((totalItems - prevTotalItems) / prevTotalItems) * 100
      : 0;

  // Top products
  const productSales: Record<
    string,
    { name: string; quantity: number; revenue: number; category?: string }
  > = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const pid = item.productId;
      const pname = item.productName || item.product?.name || "N/A";
      const qty = item.quantity;
      const rev = (item.productPrice || item.product?.price || 0) * qty;
      const cat = item.product?.category?.name || "N/A";
      if (!productSales[pid]) {
        productSales[pid] = {
          name: pname,
          quantity: 0,
          revenue: 0,
          category: cat,
        };
      }
      productSales[pid].quantity += qty;
      productSales[pid].revenue += rev;
    });
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20);

  // Category revenue
  const categoryRevenue: Record<string, number> = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const cname = item.product?.category?.name || "N/A";
      const rev =
        (item.productPrice || item.product?.price || 0) * item.quantity;
      categoryRevenue[cname] = (categoryRevenue[cname] || 0) + rev;
    });
  });

  // Daily revenue for chart
  const dailyRevenue: Record<string, number> = {};
  orders.forEach((order) => {
    const date = format(order.createdAt, "yyyy-MM-dd");
    dailyRevenue[date] = (dailyRevenue[date] || 0) + (order.total || 0);
  });

  // Get all categories for filter dropdown
  const categories = await prisma.category.findMany({
    where: { storeId },
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });

  // Get all products for filter dropdown
  const products = await prisma.product.findMany({
    where: { storeId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 100, // Limit for performance
  });

  const reportData = {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: period || "custom",
    },
    summary: {
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    },
    comparison: {
      revenueChange,
      ordersChange,
      itemsChange,
      prevPeriod: {
        start: prevStartDate.toISOString(),
        end: prevEndDate.toISOString(),
        totalRevenue: prevTotalRevenue,
        totalOrders: prevTotalOrders,
        totalItems: prevTotalItems,
      },
    },
    topProducts,
    categoryRevenue: Object.entries(categoryRevenue)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
      })),
    dailyRevenue: Object.entries(dailyRevenue)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({
        name: format(new Date(date), "dd/MM"),
        date,
        total: value,
      })),
    orders: orders.map((order) => ({
      id: order.id,
      date: format(order.createdAt, "yyyy-MM-dd"),
      total: order.total,
      items: order.orderItems.length,
      status: order.status,
    })),
    filters: {
      categories,
      products,
      selectedCategory: categoryId || null,
      selectedProduct: productId || null,
    },
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
