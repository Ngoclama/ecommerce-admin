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
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
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

  // Format categories with parent info (original data without level)
  const formattedCategories: CategoryColumn[] = categories.map((item) => ({
    id: item.id,
    name: item.name,
    billboardLabel: item.billboard?.label || "N/A",
    slug: item.slug || "",
    imageUrl: item.imageUrl || null,
    parentName: item.parent?.name || null,
    parentId: item.parentId || undefined,
    productsCount: item._count.products.toString(),
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  // Build hierarchy tree for display
  const buildTree = (items: typeof categories) => {
    const parentCategories = items.filter((cat) => !cat.parentId);
    const childCategories = items.filter((cat) => cat.parentId);

    const result: CategoryColumn[] = [];

    parentCategories.forEach((parent) => {
      const parentFormatted = formattedCategories.find(
        (fc) => fc.id === parent.id
      )!;
      result.push({
        ...parentFormatted,
        level: 0,
        hasChildren: childCategories.some((c) => c.parentId === parent.id),
      });

      // Add children
      childCategories
        .filter((child) => child.parentId === parent.id)
        .forEach((child) => {
          const childFormatted = formattedCategories.find(
            (fc) => fc.id === child.id
          )!;
          result.push({
            ...childFormatted,
            level: 1,
            hasChildren: false,
          });
        });
    });

    return result;
  };

  const hierarchicalCategories = buildTree(categories);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryClient data={hierarchicalCategories} />
      </div>
    </div>
  );
};

export default CategoriesPage;
