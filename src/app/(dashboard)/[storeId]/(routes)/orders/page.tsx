import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { formatter } from "@/lib/utils";
import { OrderColumn } from "./components/columns";
import { OrderClient } from "./components/client";

const OrdersPage = async (
  props: { params: Promise<{ storeId: string }> }
) => {
  const params = await props.params;
  const { storeId } = params;

  const orders = await prisma.order.findMany({
    where: {
      storeId: storeId,
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedOrders: OrderColumn[] = orders.map((item) => ({
    id: item.id,
    phone: item.phone,
    
    address: item.address || "No address",

    products: item.orderItems
      .map((orderItem) => {
         return `${orderItem.product.name} (x${orderItem.quantity})`;
      })
      .join(", "),
    
    totalPrice: formatter.format(
      item.orderItems.reduce((total, orderItem) => {
        return total + (Number(orderItem.product.price) * orderItem.quantity);
      }, 0)
    ),
    
    isPaid: item.isPaid,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex-1 rounded-2xl bg-white/80 dark:bg-neutral-900/70 shadow-sm border border-neutral-200/70 dark:border-neutral-800/50 p-6 backdrop-blur-xl transition-all">
        <OrderClient data={formattedOrders} />
      </div>
    </div>
  );
};

export default OrdersPage;