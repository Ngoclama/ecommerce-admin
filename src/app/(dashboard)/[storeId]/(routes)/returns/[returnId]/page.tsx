import prisma from "@/lib/prisma";
import { ReturnForm } from "./components/return-form";
import { ObjectId } from "bson";

const ReturnPage = async ({
  params,
}: {
  params: Promise<{ returnId: string; storeId: string }>;
}) => {
  const { returnId, storeId } = await params;
  const isValidId = ObjectId.isValid(returnId);

  const returnRequest = isValidId
    ? await prisma.return.findUnique({
        where: { id: returnId },
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
      })
    : null;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ReturnForm initialData={returnRequest} />
      </div>
    </div>
  );
};

export default ReturnPage;
