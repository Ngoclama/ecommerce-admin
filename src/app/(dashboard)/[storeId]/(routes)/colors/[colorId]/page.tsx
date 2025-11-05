import prisma from "@/lib/prisma";
import { ObjectId } from "bson";
import { ColorForm } from "./components/color-form";

const ColorPage = async ({ params }: { params: { colorId: string } }) => {
  const isValidId = ObjectId.isValid(params.colorId);

  const color = isValidId
    ? await prisma.color.findUnique({
        where: { id: params.colorId },
      })
    : null;

  console.log("Params:", params);

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ColorForm initialData={color} />
      </div>
    </div>
  );
};

export default ColorPage;