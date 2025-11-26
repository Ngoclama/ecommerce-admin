import prisma from "@/lib/prisma";
import { ObjectId } from "bson";
import { ColorForm } from "./components/color-form";

const ColorPage = async ({
  params,
}: {
  params: Promise<{ storeId: string; colorId: string }>;
}) => {
  const { storeId, colorId } = await params;
  const isValidId = ObjectId.isValid(colorId);

  const color = isValidId
    ? await prisma.color.findUnique({
        where: { id: colorId },
      })
    : null;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ColorForm initialData={color} />
      </div>
    </div>
  );
};

export default ColorPage;
