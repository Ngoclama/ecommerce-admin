import prisma from "@/lib/prisma";
import { ProductImportClient } from "./components/product-import-client";

const ProductImportPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;

  // Fetch categories with parent info for mapping
  const categories = await prisma.category.findMany({
    where: { storeId },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const sizes = await prisma.size.findMany({
    where: { storeId },
    orderBy: { name: "asc" },
  });

  const colors = await prisma.color.findMany({
    where: { storeId },
    orderBy: { name: "asc" },
  });

  const materials = await prisma.material.findMany({
    where: { storeId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductImportClient
          categories={categories}
          sizes={sizes}
          colors={colors}
          materials={materials}
        />
      </div>
    </div>
  );
};

export default ProductImportPage;
