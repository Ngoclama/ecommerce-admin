import prisma from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";

export type PeriodType = "day" | "week" | "month" | "quarter" | "year" | "custom";

export interface ReportsStatsParams {
  storeId: string;
  period?: PeriodType;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  paymentMethod?: string;
  categoryId?: string;
}

export interface ReportsStats {
  // Tổng quan
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  totalDiscount: number;
  totalShippingCost: number;
  netProfit: number; // Doanh thu - chi phí (nếu có cost pricing)
  averageOrderValue: number;

  // Theo thời gian
  timeSeriesData: Array<{
    date: string;
    revenue: number;
    orders: number;
    items: number;
  }>;

  // Theo trạng thái đơn hàng
  statusDistribution: Array<{
    status: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;

  // Theo phương thức thanh toán
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;

  // Theo danh mục
  categoryRevenue: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
    orders: number;
    items: number;
    percentage: number;
  }>;

  // Sản phẩm bán chạy
  topProducts: Array<{
    productId: string;
    productName: string;
    categoryName: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }>;

  // Màu sắc được mua nhiều nhất
  topColors: Array<{
    colorName: string;
    quantity: number;
    revenue: number;
    orders: number;
    percentage: number;
  }>;

  // Kích thước được mua nhiều nhất
  topSizes: Array<{
    sizeName: string;
    quantity: number;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
}

export const getReportsStats = async (
  params: ReportsStatsParams
): Promise<ReportsStats> => {
  const {
    storeId,
    period = "month",
    startDate,
    endDate,
    status,
    paymentMethod,
    categoryId,
  } = params;

  // Tính toán date range
  let dateStart: Date;
  let dateEnd: Date = endOfDay(new Date());

  if (period === "custom" && startDate && endDate) {
    dateStart = startOfDay(startDate);
    dateEnd = endOfDay(endDate);
  } else if (period === "day") {
    dateStart = startOfDay(new Date());
  } else if (period === "week") {
    dateStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  } else if (period === "month") {
    dateStart = startOfMonth(new Date());
  } else if (period === "quarter") {
    dateStart = startOfQuarter(new Date());
  } else if (period === "year") {
    dateStart = startOfYear(new Date());
  } else {
    dateStart = startOfMonth(new Date());
  }

  // Build where clause
  const whereClause: any = {
    storeId,
    isPaid: true,
    createdAt: {
      gte: dateStart,
      lte: dateEnd,
    },
    ...(status && { status }),
    ...(paymentMethod && { paymentMethod }),
    ...(categoryId
      ? {
          orderItems: {
            some: {
              product: {
                categoryId,
              },
            },
          },
        }
      : {}),
  };

  // Lấy tất cả orders trong khoảng thời gian
  const orders = await prisma.order.findMany({
    where: whereClause,
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
      createdAt: "asc",
    },
  });

  // Tính tổng quan
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const totalItemsSold = orders.reduce(
    (sum, order) =>
      sum + order.orderItems.reduce((s, item) => s + item.quantity, 0),
    0
  );
  const totalDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
  const totalShippingCost = orders.reduce(
    (sum, order) => sum + (order.shippingCost || 0),
    0
  );
  const netProfit = totalRevenue - totalShippingCost; // Có thể trừ thêm cost nếu có
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Time series data - nhóm theo ngày
  const timeSeriesMap: Record<string, { revenue: number; orders: number; items: number }> =
    {};
  orders.forEach((order) => {
    const dateKey = order.createdAt.toISOString().split("T")[0];
    if (!timeSeriesMap[dateKey]) {
      timeSeriesMap[dateKey] = { revenue: 0, orders: 0, items: 0 };
    }
    timeSeriesMap[dateKey].revenue += order.total || 0;
    timeSeriesMap[dateKey].orders += 1;
    timeSeriesMap[dateKey].items += order.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  });

  const timeSeriesData = Object.entries(timeSeriesMap)
    .map(([date, data]) => ({
      date,
      ...data,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  
  const statusMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((order) => {
    const orderStatus = order.status || "PENDING";
    if (!statusMap[orderStatus]) {
      statusMap[orderStatus] = { count: 0, revenue: 0 };
    }
    statusMap[orderStatus].count += 1;
    statusMap[orderStatus].revenue += order.total || 0;
  });

  const statusDistribution = Object.entries(statusMap)
    .map(([status, data]) => ({
      status,
      count: data.count,
      revenue: data.revenue,
      percentage: totalOrders > 0 ? (data.count / totalOrders) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  
  const paymentMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((order) => {
    const method = order.paymentMethod || "UNKNOWN";
    if (!paymentMap[method]) {
      paymentMap[method] = { count: 0, revenue: 0 };
    }
    paymentMap[method].count += 1;
    paymentMap[method].revenue += order.total || 0;
  });

  const paymentMethodDistribution = Object.entries(paymentMap)
    .map(([method, data]) => ({
      method,
      count: data.count,
      revenue: data.revenue,
      percentage: totalOrders > 0 ? (data.count / totalOrders) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Category revenue
  const categoryMap: Record<
    string,
    { name: string; revenue: number; orders: number; items: number }
  > = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const catId = item.product?.categoryId || "UNKNOWN";
      const catName = item.product?.category?.name || "Không phân loại";
      if (!categoryMap[catId]) {
        categoryMap[catId] = { name: catName, revenue: 0, orders: 0, items: 0 };
      }
      const itemRevenue = (item.productPrice || item.product?.price || 0) * item.quantity;
      categoryMap[catId].revenue += itemRevenue;
      categoryMap[catId].items += item.quantity;
    });
  });

  // Đếm số đơn hàng unique cho mỗi category
  const categoryOrdersMap: Record<string, Set<string>> = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const catId = item.product?.categoryId || "UNKNOWN";
      if (!categoryOrdersMap[catId]) {
        categoryOrdersMap[catId] = new Set();
      }
      categoryOrdersMap[catId].add(order.id);
    });
  });

  const categoryRevenue = Object.entries(categoryMap)
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      revenue: data.revenue,
      orders: categoryOrdersMap[categoryId]?.size || 0,
      items: data.items,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Top products
  const productMap: Record<
    string,
    {
      name: string;
      categoryName: string;
      quantity: number;
      revenue: number;
    }
  > = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const productId = item.productId;
      const productName = item.productName || item.product?.name || "N/A";
      const categoryName = item.product?.category?.name || "N/A";
      if (!productMap[productId]) {
        productMap[productId] = {
          name: productName,
          categoryName,
          quantity: 0,
          revenue: 0,
        };
      }
      const itemRevenue = (item.productPrice || item.product?.price || 0) * item.quantity;
      productMap[productId].quantity += item.quantity;
      productMap[productId].revenue += itemRevenue;
    });
  });

  const topProducts = Object.entries(productMap)
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      categoryName: data.categoryName,
      quantity: data.quantity,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20); // Top 20

  // Top colors - chỉ tính các item có màu sắc
  const colorMap: Record<
    string,
    { quantity: number; revenue: number; orders: Set<string> }
  > = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      // Chỉ tính các item có colorName
      if (!item.colorName || item.colorName.trim() === "") {
        return;
      }
      const colorName = item.colorName;
      if (!colorMap[colorName]) {
        colorMap[colorName] = {
          quantity: 0,
          revenue: 0,
          orders: new Set(),
        };
      }
      const itemRevenue = (item.productPrice || item.product?.price || 0) * item.quantity;
      colorMap[colorName].quantity += item.quantity;
      colorMap[colorName].revenue += itemRevenue;
      colorMap[colorName].orders.add(order.id);
    });
  });

  const topColors = Object.entries(colorMap)
    .map(([colorName, data]) => ({
      colorName,
      quantity: data.quantity,
      revenue: data.revenue,
      orders: data.orders.size,
      percentage: totalItemsSold > 0 ? (data.quantity / totalItemsSold) * 100 : 0,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 15); // Top 15

  // Top sizes - chỉ tính các item có kích thước
  const sizeMap: Record<
    string,
    { quantity: number; revenue: number; orders: Set<string> }
  > = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      // Chỉ tính các item có sizeName
      if (!item.sizeName || item.sizeName.trim() === "") {
        return;
      }
      const sizeName = item.sizeName;
      if (!sizeMap[sizeName]) {
        sizeMap[sizeName] = {
          quantity: 0,
          revenue: 0,
          orders: new Set(),
        };
      }
      const itemRevenue = (item.productPrice || item.product?.price || 0) * item.quantity;
      sizeMap[sizeName].quantity += item.quantity;
      sizeMap[sizeName].revenue += itemRevenue;
      sizeMap[sizeName].orders.add(order.id);
    });
  });

  const topSizes = Object.entries(sizeMap)
    .map(([sizeName, data]) => ({
      sizeName,
      quantity: data.quantity,
      revenue: data.revenue,
      orders: data.orders.size,
      percentage: totalItemsSold > 0 ? (data.quantity / totalItemsSold) * 100 : 0,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 15); // Top 15

  return {
    totalRevenue,
    totalOrders,
    totalItemsSold,
    totalDiscount,
    totalShippingCost,
    netProfit,
    averageOrderValue,
    timeSeriesData,
    statusDistribution,
    paymentMethodDistribution,
    categoryRevenue,
    topProducts,
    topColors,
    topSizes,
  };
};

