import prisma from "@/lib/prisma";
import { BillboardForm } from "./components/billboard-form";
import { ObjectId } from "bson"; 

const BillboardPage = async ({
  params,
}: {
  params: { billboardId: string };
}) => {
  const isValidId = ObjectId.isValid(params.billboardId);

  const billboard = isValidId
    ? await prisma.billboard.findUnique({
        where: { id: params.billboardId },
      })
    : null;

  console.log("Params:", params);

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BillboardForm initialData={billboard} />
      </div>
    </div>
  );
};

export default BillboardPage;
