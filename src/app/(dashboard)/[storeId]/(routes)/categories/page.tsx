import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { CategoryClient } from "./components/client";
import { CategoryColumn } from "./components/columns";
const CategoriesPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;
  const categories = await prisma.category.findMany({
    where: {
      storeId: storeId,
    },
    include: {
      billboard: true,

      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedCategories: CategoryColumn[] = categories.map((item) => ({
    id: item.id,
    name: item.name,
    billboardLabel: item.billboard?.label || "N/A",
    slug: item.slug || "",
    productsCount: item._count.products.toString(),
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryClient data={formattedCategories} />
      </div>
    </div>
  );
};

export default CategoriesPage;
