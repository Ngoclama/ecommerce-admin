import prisma from "@/lib/prisma";
import { ObjectId } from "bson";
import { SizeForm } from "./components/size-form";

const SizePage = async ({
  params,
}: {
  params: Promise<{ storeId: string; sizeId: string }>;
}) => {
  const { storeId, sizeId } = await params;
  const isValidId = ObjectId.isValid(sizeId);

  const size = isValidId
    ? await prisma.size.findFirst({
        where: {
          id: sizeId,
          storeId: storeId,
        },
      })
    : null;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SizeForm initialData={size} />
      </div>
    </div>
  );
};

export default SizePage;
