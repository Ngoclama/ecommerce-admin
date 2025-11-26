import prisma from "@/lib/prisma";
import { MaterialForm } from "./components/material-form";

const MaterialPage = async ({
  params,
}: {
  params: Promise<{ storeId: string; materialId: string }>;
}) => {
  const { storeId, materialId } = await params;

  const material = await prisma.material
    .findFirst({
      where: {
        id: materialId,
        storeId: storeId,
      },
    })
    .catch(() => null);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <MaterialForm initialData={material} />
      </div>
    </div>
  );
};

export default MaterialPage;
