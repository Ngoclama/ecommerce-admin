import prisma from "@/lib/prisma";
import { formatter } from "@/lib/utils";
import { ProductClient } from "./components/client";
import { format } from "date-fns";
import { ProductColumn } from "./components/columns";
const ProductPage = async ({ params }: { params: { storeId: string } }) => {
  const products = await prisma.product.findMany({
    where: {
      storeId: params.storeId,
    },

    include: {
      category: true,
      color: true,
      size: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const formattedProducts: ProductColumn[] = products.map((item) => ({
    id: item.id,
    name: item.name,
    isFeatured: item.isFeatured,
    isArchived: item.isArchived,
    price: formatter.format(Number(item.price)), 
    category: item.category.name,
    size: item.size.name,
    color: item.color.value,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));
  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header + Table */}
      <div className="flex-1 rounded-2xl bg-white/80 dark:bg-neutral-900/70 shadow-sm border border-neutral-200/70 dark:border-neutral-800/50 p-6 backdrop-blur-xl transition-all">
        <ProductClient data={formattedProducts} />
      </div>
    </div>
  );
};

export default ProductPage;
