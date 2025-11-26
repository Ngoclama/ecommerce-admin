import prisma from "@/lib/prisma";
import { BillboardForm } from "./components/billboard-form";
import { ObjectId } from "bson";

const BillboardPage = async ({
  params,
}: {
  params: Promise<{ billboardId: string; storeId: string }>;
}) => {
  const { billboardId } = await params;
  const isValidId = ObjectId.isValid(billboardId);

  const billboard = isValidId
    ? await prisma.billboard.findUnique({
        where: { id: billboardId },
      })
    : null;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillboardForm initialData={billboard} />
      </div>
    </div>
  );
};

export default BillboardPage;
