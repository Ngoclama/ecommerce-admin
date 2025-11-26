import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { ReturnClient } from "./components/client";
import { ReturnColumn } from "./components/columns";

const ReturnsPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;

  const returns = await prisma.return.findMany({
    where: {
      order: {
        storeId: storeId,
      },
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
      user: true,
      returnItems: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedReturns: ReturnColumn[] = returns.map((item) => ({
    id: item.id,
    orderId: item.orderId,
    orderNumber: `#${item.orderId.slice(-8)}`,
    customerName: item.user.name || item.user.email || "Anonymous",
    customerEmail: item.user.email,
    status: item.status,
    reason: item.reason,
    refundAmount: item.refundAmount,
    refundMethod: item.refundMethod || null,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ReturnClient data={formattedReturns} />
      </div>
    </div>
  );
};

export default ReturnsPage;
