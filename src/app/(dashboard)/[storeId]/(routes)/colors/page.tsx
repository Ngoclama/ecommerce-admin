import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { ColorClient } from "./components/client";
import { ColorColumn } from "./components/columns";

const ColorsPage = async ({ params }: { params: { storeId: string } }) => {
  const colors = await prisma.color.findMany({
    where: {
      storeId: params.storeId,
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

  const formattedColors: ColorColumn[] = colors.map((item) => ({
    id: item.id,
    name: item.name,
    value: item.value,
    productsCount: item._count.products.toString(),
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ColorClient data={formattedColors} />
      </div>
    </div>
  );
};

export default ColorsPage;
