import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { FlashSaleClient } from "./components/client";
import { FlashSaleColumn } from "./components/columns";

const FlashSalesPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;

  const flashSales = await prisma.flashSale.findMany({
    where: {
      storeId: storeId,
    },
    include: {
      flashSaleProducts: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedFlashSales: FlashSaleColumn[] = flashSales.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    startDate: item.startDate.toISOString(),
    endDate: item.endDate.toISOString(),
    discountType: item.discountType,
    discountValue: item.discountValue,
    productCount: item.flashSaleProducts.length,
    isActive: item.isActive,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <FlashSaleClient data={formattedFlashSales} />
      </div>
    </div>
  );
};

export default FlashSalesPage;

