import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { formatter } from "@/lib/utils";

import { ProductClient } from "./components/client";
import { ProductColumn } from "./components/columns";

const ProductsPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;

  const products = await prisma.product.findMany({
    where: {
      storeId: storeId,
    },
    include: {
      category: true,
      material: true,
      images: true,
      // 👇 Include variants để hiển thị tóm tắt
      variants: {
        include: {
          size: true,
          color: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedProducts: ProductColumn[] = products.map((item) => {
    // Tổng hợp danh sách size và màu từ variants
    const sizes = Array.from(
      new Set(item.variants.map((v) => v.size.name))
    ).join(", ");
    const colors = Array.from(
      new Set(item.variants.map((v) => v.color.value))
    ).join(", "); // Hiển thị mã màu hoặc tên màu
    const totalInventory = item.variants.reduce(
      (acc, curr) => acc + curr.inventory,
      0
    );

    return {
      id: item.id,
      name: item.name,
      isFeatured: item.isFeatured,
      isArchived: item.isArchived,
      price: formatter.format(Number(item.price)),
      category: item.category.name,
      // Hiển thị dạng chuỗi gộp
      size: sizes || "N/A",
      color: colors || "N/A",
      inventory: totalInventory,
      material: item.material?.name || "N/A",
      gender: item.gender || "UNISEX",
      createdAt: format(item.createdAt, "MMMM do, yyyy"),
      images: item.images,
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductClient data={formattedProducts} />
      </div>
    </div>
  );
};

export default ProductsPage;
