import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { ShippingClient } from "./components/client";
import { ShippingColumn } from "./components/columns";

const ShippingPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;

  const shippings = await prisma.shipping.findMany({
    where: {
      storeId: storeId,
    },
    include: {
      order: {
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedShippings: ShippingColumn[] = shippings.map((item) => ({
    id: item.id,
    orderId: item.orderId,
    orderNumber: `#${item.orderId.slice(-8)}`,
    trackingNumber: item.trackingNumber,
    provider: item.provider,
    status: item.status,
    toName: item.toName,
    toAddress: item.toAddress,
    shippingCost: item.shippingCost,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ShippingClient data={formattedShippings} />
      </div>
    </div>
  );
};

export default ShippingPage;

