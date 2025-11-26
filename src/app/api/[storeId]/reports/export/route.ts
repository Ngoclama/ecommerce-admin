import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, format as formatDate } from "date-fns";

// GET: Export reports as PDF or Excel
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);

    const format = searchParams.get("format") || "pdf";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Get date range
    const endDate = endDateParam
      ? endOfDay(new Date(endDateParam))
      : endOfDay(new Date());
    const startDate = startDateParam
      ? startOfDay(new Date(startDateParam))
      : startOfDay(new Date());

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        storeId: storeId,
        isPaid: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
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
        const revenue =
          (item.productPrice || item.product.price) * item.quantity;
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
        date: formatDate(order.createdAt, "yyyy-MM-dd"),
        total: order.total,
        items: order.orderItems.length,
        status: order.status,
      })),
    };

    if (format === "pdf") {
      // Tạm thời trả về JSON, sẽ implement PDF sau
      return NextResponse.json(reportData, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="report-${startDateParam}-${endDateParam}.json"`,
        },
      });
    } else if (format === "excel") {
      // Tạm thời trả về JSON, sẽ implement Excel sau
      return NextResponse.json(reportData, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="report-${startDateParam}-${endDateParam}.json"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("[REPORTS_EXPORT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
