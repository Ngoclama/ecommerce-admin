import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { formatter } from "@/lib/utils";

import { OrderClient } from "./components/client";
import { OrderColumn } from "./components/columns";

const OrdersPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;

  const orders = await prisma.order
    .findMany({
      where: {
        storeId: storeId,
      },
      select: {
        id: true,
        phone: true,
        address: true,
        email: true,
        total: true,
        isPaid: true,
        status: true,
        shippingMethod: true,
        trackingNumber: true,
        paymentMethod: true,
        createdAt: true,
        orderItems: {
          select: {
            id: true,
            productName: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    })
    .catch((error: any) => {
      if (error?.code === "P2032" && error?.meta?.field === "updatedAt") {
        console.error(
          "[ORDERS_PAGE] Detected old data with null updatedAt. Please run: npx ts-node --esm scripts/fix-order-dates.ts"
        );
        return [];
      }
      throw error;
    });

  const formattedOrders: OrderColumn[] = orders
    .filter((item) => item.createdAt)
    .map((item) => ({
      id: item.id,
      phone: item.phone,
      address: item.address,
      email: item.email || null,
      products: item.orderItems
        .map(
          (orderItem: (typeof item.orderItems)[0]) =>
            orderItem.productName || orderItem.product.name
        )
        .join(", "),
      totalPrice: formatter.format(Number(item.total || 0)),
      isPaid: item.isPaid,
      createdAt: format(item.createdAt!, "MMMM do, yyyy"),
      status: item.status || "PENDING",
      shippingMethod: item.shippingMethod || null,
      trackingNumber: item.trackingNumber || null,
      paymentMethod: item.paymentMethod || null,
    }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderClient data={formattedOrders} />
      </div>
    </div>
  );
};

export default OrdersPage;
