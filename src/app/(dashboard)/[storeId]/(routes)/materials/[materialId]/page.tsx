import prisma from "@/lib/prisma";
import { MaterialForm } from "./components/material-form";

const MaterialPage = async ({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) => {
  const { materialId } = await params;

  const material = await prisma.material
    .findUnique({
      where: {
        id: materialId,
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
