import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, format as formatDate, subDays } from "date-fns";
import { API_MESSAGES, HTTP_STATUS } from "@/lib/constants";
import * as XLSX from "xlsx";

// Helper function to map status to Vietnamese labels
const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: "Chờ xử lý",
    PROCESSING: "Đang xử lý",
    SHIPPED: "Đã giao hàng",
    DELIVERED: "Đã nhận hàng",
    CANCELLED: "Đã hủy",
    RETURNED: "Đã trả hàng",
  };
  return statusMap[status] || status;
};

// Helper function to map payment method to Vietnamese labels
const getPaymentMethodLabel = (method: string): string => {
  const methodMap: Record<string, string> = {
    COD: "Thanh toán khi nhận hàng",
    VNPAY: "VNPay",
    MOMO: "MoMo",
    STRIPE: "Stripe",
    QR: "Quét mã QR",
  };
  return methodMap[method] || method;
};

// GET: Export reports as PDF or Excel
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);

    const format = searchParams.get("format") || "excel";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const period =
      (searchParams.get("period") as
        | "custom"
        | "week"
        | "month"
        | "quarter"
        | null) || "custom";
    const categoryId = searchParams.get("categoryId");
    const productId = searchParams.get("productId");

    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse(API_MESSAGES.UNAUTHORIZED, {
        status: HTTP_STATUS.FORBIDDEN,
      });
    }

    // Get date range
    // Determine date range by period
    let endDate = endOfDay(new Date());
    let startDate = startOfDay(subDays(endDate, 30));
    if (period === "custom") {
      endDate = endDateParam ? endOfDay(new Date(endDateParam)) : endDate;
      startDate = startDateParam
        ? startOfDay(new Date(startDateParam))
        : startDate;
    } else if (period === "week") {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7; // Monday as start
      startDate = startOfDay(subDays(now, diffToMonday));
      endDate = endOfDay(now);
    } else if (period === "month") {
      const now = new Date();
      startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      endDate = endOfDay(now);
    } else if (period === "quarter") {
      const now = new Date();
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = startOfDay(new Date(now.getFullYear(), quarterStartMonth, 1));
      endDate = endOfDay(now);
    }

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        storeId: storeId,
        isPaid: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(categoryId || productId
          ? {
              orderItems: {
                some: {
                  ...(productId ? { productId } : {}),
                  ...(categoryId ? { product: { categoryId } } : {}),
                },
              },
            }
          : {}),
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
        user: true,
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
      { name: string; quantity: number; revenue: number; category: string }
    > = {};
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const productId = item.productId;
        const productName = item.productName || item.product.name;
        const quantity = item.quantity;
        const revenue = (item.productPrice || item.product.price) * quantity;
        const category = item.product.category?.name || "N/A";

        if (!productSales[productId]) {
          productSales[productId] = {
            name: productName,
            quantity: 0,
            revenue: 0,
            category,
          };
        }
        productSales[productId].quantity += quantity;
        productSales[productId].revenue += revenue;
      });
    });

    const topProducts = Object.values(productSales).sort(
      (a, b) => b.revenue - a.revenue
    );

    // Category revenue
    const categoryRevenue: Record<string, number> = {};
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const categoryName = item.product.category?.name || "N/A";
        const revenue =
          (item.productPrice || item.product.price) * item.quantity;
        categoryRevenue[categoryName] =
          (categoryRevenue[categoryName] || 0) + revenue;
      });
    });

    // Daily revenue
    const dailyRevenue: Record<string, number> = {};
    orders.forEach((order) => {
      const date = formatDate(order.createdAt, "yyyy-MM-dd");
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (order.total || 0);
    });

    // Order status distribution
    const statusCount: Record<string, number> = {};
    orders.forEach((order) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    // Payment method distribution
    const paymentCount: Record<string, number> = {};
    orders.forEach((order) => {
      const method = order.paymentMethod || "UNKNOWN";
      paymentCount[method] = (paymentCount[method] || 0) + 1;
    });

    if (format === "excel") {
      // Create Excel workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["BÁO CÁO DOANH THU CHI TIẾT"],
        [`Cửa hàng: ${store.name}`],
        [
          `Thời gian: ${formatDate(startDate, "dd/MM/yyyy")} - ${formatDate(
            endDate,
            "dd/MM/yyyy"
          )}`,
        ],
        [`Ngày xuất: ${formatDate(new Date(), "dd/MM/yyyy HH:mm:ss")}`],
        [],
        ["═══════════════════════════════════════════"],
        ["TỔNG QUAN"],
        ["═══════════════════════════════════════════"],
        ["Chỉ tiêu", "Giá trị"],
        ["Tổng doanh thu", totalRevenue.toLocaleString("vi-VN") + " ₫"],
        ["Tổng đơn hàng", totalOrders],
        ["Tổng sản phẩm bán", totalItems],
        [
          "Giá trị đơn hàng TB",
          (totalOrders > 0 ? totalRevenue / totalOrders : 0).toLocaleString(
            "vi-VN"
          ) + " ₫",
        ],
        [],
        ["PHÂN BỐ TRẠNG THÁI ĐƠN HÀNG"],
        ["Trạng thái", "Số lượng", "Tỷ lệ"],
        ...Object.entries(statusCount).map(([status, count]) => [
          getStatusLabel(status),
          count,
          `${((count / totalOrders) * 100).toFixed(2)}%`,
        ]),
      ];
      const ws_summary = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths
      ws_summary["!cols"] = [{ wch: 30 }, { wch: 25 }, { wch: 15 }];

      XLSX.utils.book_append_sheet(wb, ws_summary, "Tổng quan");

      // Top Products sheet
      const productsData = [
        ["TOP SẢN PHẨM BÁN CHẠY"],
        [],
        [
          "STT",
          "Sản phẩm",
          "Danh mục",
          "Số lượng bán",
          "Doanh thu",
          "% Doanh thu",
        ],
        ...topProducts.map((p, index) => [
          index + 1,
          p.name,
          p.category,
          p.quantity,
          p.revenue.toLocaleString("vi-VN") + " ₫",
          `${((p.revenue / totalRevenue) * 100).toFixed(2)}%`,
        ]),
        [],
        [
          "TỔNG CỘNG",
          "",
          "",
          topProducts.reduce((s, p) => s + p.quantity, 0),
          totalRevenue.toLocaleString("vi-VN") + " ₫",
          "100%",
        ],
      ];
      const ws_products = XLSX.utils.aoa_to_sheet(productsData);
      ws_products["!cols"] = [
        { wch: 5 },
        { wch: 40 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, ws_products, "Sản phẩm bán chạy");

      // Category Revenue sheet
      const categoryData = [
        ["DOANH THU THEO DANH MỤC"],
        [],
        ["STT", "Danh mục", "Doanh thu", "% Doanh thu"],
        ...Object.entries(categoryRevenue)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value], index) => [
            index + 1,
            name,
            value.toLocaleString("vi-VN") + " ₫",
            `${((value / totalRevenue) * 100).toFixed(2)}%`,
          ]),
        [],
        ["TỔNG CỘNG", "", totalRevenue.toLocaleString("vi-VN") + " ₫", "100%"],
      ];
      const ws_category = XLSX.utils.aoa_to_sheet(categoryData);
      ws_category["!cols"] = [
        { wch: 5 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, ws_category, "Doanh thu theo danh mục");

      // Payment Method Distribution sheet
      const paymentData = [
        ["PHÂN BỐ THEO PHƯƠNG THỨC THANH TOÁN"],
        [],
        ["STT", "Phương thức", "Số lượng", "% Số lượng"],
        ...Object.entries(paymentCount)
          .sort((a, b) => b[1] - a[1])
          .map(([method, count], index) => [
            index + 1,
            getPaymentMethodLabel(method),
            count,
            `${((count / totalOrders) * 100).toFixed(2)}%`,
          ]),
        [],
        ["TỔNG CỘNG", "", totalOrders, "100%"],
      ];
      const ws_payment = XLSX.utils.aoa_to_sheet(paymentData);
      ws_payment["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws_payment, "Phương thức thanh toán");

      // Daily Revenue sheet
      const dailyData = [
        ["DOANH THU THEO NGÀY"],
        [],
        ["STT", "Ngày", "Doanh thu", "Số đơn"],
        ...Object.entries(dailyRevenue)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, value], index) => {
            const ordersOnDate = orders.filter(
              (o) => formatDate(o.createdAt, "yyyy-MM-dd") === date
            ).length;
            return [
              index + 1,
              formatDate(new Date(date), "dd/MM/yyyy"),
              value.toLocaleString("vi-VN") + " ₫",
              ordersOnDate,
            ];
          }),
        [],
        [
          "TỔNG CỘNG",
          "",
          totalRevenue.toLocaleString("vi-VN") + " ₫",
          totalOrders,
        ],
      ];
      const ws_daily = XLSX.utils.aoa_to_sheet(dailyData);
      ws_daily["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws_daily, "Doanh thu theo ngày");

      // Orders detail sheet
      const ordersData = [
        ["CHI TIẾT ĐƠN HÀNG"],
        [],
        [
          "STT",
          "Mã đơn",
          "Ngày đặt",
          "Khách hàng",
          "Số điện thoại",
          "Phương thức TT",
          "Trạng thái",
          "Số sản phẩm",
          "Tổng tiền",
        ],
        ...orders.map((order, index) => [
          index + 1,
          order.id.substring(0, 8),
          formatDate(order.createdAt, "dd/MM/yyyy HH:mm"),
          order.user?.name || "Khách lẻ",
          order.phone || "N/A",
          getPaymentMethodLabel(order.paymentMethod || "UNKNOWN"),
          getStatusLabel(order.status),
          order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
          (order.total || 0).toLocaleString("vi-VN") + " ₫",
        ]),
        [],
        [
          "TỔNG CỘNG",
          "",
          "",
          "",
          "",
          "",
          "",
          totalItems,
          totalRevenue.toLocaleString("vi-VN") + " ₫",
        ],
      ];
      const ws_orders = XLSX.utils.aoa_to_sheet(ordersData);
      ws_orders["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 18 },
        { wch: 25 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 12 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, ws_orders, "Chi tiết đơn hàng");

      // Generate buffer
      const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=bao-cao-${formatDate(
            startDate,
            "yyyy-MM-dd"
          )}-${formatDate(endDate, "yyyy-MM-dd")}.xlsx`,
        },
      });
    } else if (format === "pdf") {
      // Return data for client-side PDF generation
      return NextResponse.json({
        store: {
          name: store.name,
          address: store.address,
          phone: store.phone,
          email: store.email,
        },
        period: {
          start: formatDate(startDate, "dd/MM/yyyy"),
          end: formatDate(endDate, "dd/MM/yyyy"),
        },
        summary: {
          totalRevenue,
          totalOrders,
          totalItems,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        },
        topProducts: topProducts.slice(0, 15),
        categoryRevenue: Object.entries(categoryRevenue)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({
            name,
            value,
            percentage: ((value / totalRevenue) * 100).toFixed(2),
          })),
        dailyRevenue: Object.entries(dailyRevenue)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, value]) => ({
            date: formatDate(new Date(date), "dd/MM/yyyy"),
            value,
          })),
        statusDistribution: Object.entries(statusCount).map(
          ([status, count]) => ({
            status: getStatusLabel(status),
            count,
            percentage: ((count / totalOrders) * 100).toFixed(2),
          })
        ),
        orders: orders.slice(0, 50).map((order) => ({
          id: order.id.substring(0, 8),
          date: formatDate(order.createdAt, "dd/MM/yyyy HH:mm"),
          customer: order.user?.name || "Khách lẻ",
          phone: order.phone || "N/A",
          paymentMethod: getPaymentMethodLabel(
            order.paymentMethod || "UNKNOWN"
          ),
          status: getStatusLabel(order.status),
          items: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
          total: order.total || 0,
        })),
      });
    }

    return new NextResponse("Invalid format", {
      status: HTTP_STATUS.BAD_REQUEST,
    });
  } catch (error) {
    console.error("[REPORTS_EXPORT]", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
