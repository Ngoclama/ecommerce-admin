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
import { getReportsStats, PeriodType } from "@/action/get-reports-stats";
import type { Prisma } from "@prisma/client";

const ReportsPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    period?: PeriodType;
    categoryId?: string;
    productId?: string;
    status?: string;
    paymentMethod?: string;
  }>;
}) => {
  const { storeId } = await params;
  const {
    startDate: startDateParam,
    endDate: endDateParam,
    period,
    categoryId,
    productId,
    status,
    paymentMethod,
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

  // Sử dụng action function mới để lấy thống kê
  const stats = await getReportsStats({
    storeId,
    period: period || "month",
    startDate: period === "custom" ? startDate : undefined,
    endDate: period === "custom" ? endDate : undefined,
    status: status || undefined,
    paymentMethod: paymentMethod || undefined,
    categoryId: categoryId || undefined,
  });

  // Tính toán so sánh với kỳ trước
  const prevStats = await getReportsStats({
    storeId,
    period: period || "month",
    startDate: prevStartDate,
    endDate: prevEndDate,
    status: status || undefined,
    paymentMethod: paymentMethod || undefined,
    categoryId: categoryId || undefined,
  });

  // Calculate percentage changes
  const revenueChange =
    prevStats.totalRevenue > 0
      ? ((stats.totalRevenue - prevStats.totalRevenue) / prevStats.totalRevenue) * 100
      : 0;
  const ordersChange =
    prevStats.totalOrders > 0
      ? ((stats.totalOrders - prevStats.totalOrders) / prevStats.totalOrders) * 100
      : 0;
  const itemsChange =
    prevStats.totalItemsSold > 0
      ? ((stats.totalItemsSold - prevStats.totalItemsSold) / prevStats.totalItemsSold) * 100
      : 0;

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

  // Format time series data for charts
  const dailyRevenue = stats.timeSeriesData.map((item) => ({
    name: format(new Date(item.date), "dd/MM"),
    date: item.date,
    total: item.revenue,
  }));

  const reportData = {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: period || "custom",
    },
    summary: {
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      totalItems: stats.totalItemsSold,
      totalDiscount: stats.totalDiscount,
      totalShippingCost: stats.totalShippingCost,
      netProfit: stats.netProfit,
      averageOrderValue: stats.averageOrderValue,
    },
    comparison: {
      revenueChange,
      ordersChange,
      itemsChange,
      prevPeriod: {
        start: prevStartDate.toISOString(),
        end: prevEndDate.toISOString(),
        totalRevenue: prevStats.totalRevenue,
        totalOrders: prevStats.totalOrders,
        totalItems: prevStats.totalItemsSold,
      },
    },
    topProducts: stats.topProducts.map((p) => ({
      name: p.productName,
      quantity: p.quantity,
      revenue: p.revenue,
      category: p.categoryName,
      productId: p.productId,
    })),
    categoryRevenue: stats.categoryRevenue.map((c) => ({
      name: c.categoryName,
      value: c.revenue,
      categoryId: c.categoryId,
    })),
    statusDistribution: stats.statusDistribution,
    paymentMethodDistribution: stats.paymentMethodDistribution,
    topColors: stats.topColors,
    topSizes: stats.topSizes,
    dailyRevenue,
    filters: {
      categories,
      products,
      selectedCategory: categoryId || null,
      selectedProduct: productId || null,
      selectedStatus: status || null,
      selectedPaymentMethod: paymentMethod || null,
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
