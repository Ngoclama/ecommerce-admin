import prisma from "@/lib/prisma";
import { ObjectId } from "bson";
import { SizeForm } from "./components/size-form";

const SizePage = async ({ params }: { params: { sizeId: string } }) => {
  const isValidId = ObjectId.isValid(params.sizeId);

  const size = isValidId
    ? await prisma.size.findUnique({
        where: { id: params.sizeId },
      })
    : null;

  console.log("Params:", params);

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SizeForm initialData={size} />
      </div>
      
    </div>
  );
};

export default SizePage;
