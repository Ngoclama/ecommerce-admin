import prisma from "@/lib/prisma";
import { ProductForm } from "./components/product-form";
import { auth } from "@clerk/nextjs/server";

const ProductPage = async ({
  params,
}: {
  params: Promise<{ productId: string; storeId: string }>;
}) => {
  const { productId, storeId } = await params;
  const { userId } = await auth();

  
  const product =
    productId === "new"
      ? null
      : await prisma.product.findUnique({
          where: {
            id: productId,
          },
          include: {
            images: true,
          },
        });

  const categories = await prisma.category.findMany({
    where: {
      storeId: storeId,
    },
  });

  const sizes = await prisma.size.findMany({
    where: {
      storeId: storeId,
    },
  });

  const colors = await prisma.color.findMany({
    where: {
      storeId: storeId,
    },
  });

  const materials = await prisma.material.findMany({
    where: {
      storeId: storeId,
    },
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductForm
          categories={categories}
          colors={colors}
          sizes={sizes}
          materials={materials} 
          initialData={product}
        />
      </div>
    </div>
  );
};

export default ProductPage;