import { CategoryClient } from "./components/client";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { CategoryColumn } from "./components/columns";

const CategoryPage = async ({ params }: { params: { storeId: string } }) => {
  const categories = await prisma.category.findMany({
    where: {
      storeId: params.storeId,
    },
    include: {
      billboard: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const formattedCategories: CategoryColumn[] = categories.map((item) => ({
    id: item.id,
    name: item.name,
    billboardLabel: item.billboard.label,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));
  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header + Table */}
      <div className="flex-1 rounded-2xl bg-white/80 dark:bg-neutral-900/70 shadow-sm border border-neutral-200/70 dark:border-neutral-800/50 p-6 backdrop-blur-xl transition-all">
        <CategoryClient data={formattedCategories} />
      </div>
    </div>
  );
};

export default CategoryPage;
