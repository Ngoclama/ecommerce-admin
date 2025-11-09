import { CategoryClient } from "./components/client";
import prisma from "@/lib/prisma";

const CategoriesPage = async ({ params }: { params: { storeId: string } }) => {
  const categories = await prisma.category.findMany({
    where: { storeId: params.storeId },
    include: { billboard: true },
    orderBy: { createdAt: "desc" },
  });

  const formatted = categories.map((item) => ({
    id: item.id,
    name: item.name,
    billboardLabel: item.billboard.label,
    createdAt: item.createdAt.toLocaleDateString("vi-VN"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryClient data={formatted} />
      </div>
    </div>
  );
};

export default CategoriesPage;
