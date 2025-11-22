import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { MaterialClient } from "./components/client";
import { MaterialColumn } from "./components/columns";

const MaterialsPage = async ({ params }: { params: { storeId: string } }) => {
  const { storeId } = await params;

  const materials = await prisma.material.findMany({
    where: {
      storeId: storeId,
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedMaterials: MaterialColumn[] = materials.map((item) => ({
    id: item.id,
    name: item.name,
    value: item.value,
    productsCount: item._count.products.toString(),
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <MaterialClient data={formattedMaterials} />
      </div>
    </div>
  );
};

export default MaterialsPage;
