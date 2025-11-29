import prisma from "@/lib/prisma";
import { ProductForm } from "./components/product-form";
import { auth } from "@clerk/nextjs/server";

const ProductPage = async ({
  params,
}: {
  params: Promise<{ productId: string; storeId: string }>;
}) => {
  const { productId, storeId } = await params;

  const product =
    productId === "new"
      ? null
      : await prisma.product.findUnique({
          where: {
            id: productId,
          },
          include: {
            images: true,
            // 👇 Include variants để truyền vào form
            variants: {
              include: {
                size: true,
                color: true,
              },
            },
          },
        });

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
    orderBy: {
      name: "asc",
    },
  });
  const sizes = await prisma.size.findMany({ where: { storeId } });
  const colors = await prisma.color.findMany({ where: { storeId } });
  const materials = await prisma.material.findMany({ where: { storeId } });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductForm
          categories={categories}
          colors={colors}
          sizes={sizes}
          materials={materials}
          // @ts-ignore - Prisma types sometimes mismatch with exact form types, handled in component
          initialData={product}
        />
      </div>
    </div>
  );
};

export default ProductPage;
