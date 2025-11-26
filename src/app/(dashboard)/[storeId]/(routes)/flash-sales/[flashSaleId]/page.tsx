import prisma from "@/lib/prisma";
import { FlashSaleForm } from "./components/flash-sale-form";
import { ObjectId } from "bson";

const FlashSalePage = async ({
  params,
}: {
  params: Promise<{ flashSaleId: string; storeId: string }>;
}) => {
  const { flashSaleId, storeId } = await params;
  const isValidId = ObjectId.isValid(flashSaleId);

  const flashSale = isValidId
    ? await prisma.flashSale.findUnique({
        where: { id: flashSaleId },
        include: {
          flashSaleProducts: {
            include: {
              product: true,
            },
          },
        },
      })
    : null;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <FlashSaleForm initialData={flashSale} />
      </div>
    </div>
  );
};

export default FlashSalePage;
