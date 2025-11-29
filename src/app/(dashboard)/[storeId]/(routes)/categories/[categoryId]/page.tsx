import prisma from "@/lib/prisma";
import { CategoryForm } from "./components/category-form";
import { ObjectId } from "bson";

const CategoryPage = async ({
  params,
}: {
  params: Promise<{ categoryId: string; storeId: string }>;
}) => {
  const { categoryId, storeId } = await params;
  const isValidId = ObjectId.isValid(categoryId);

  const category = isValidId
    ? await prisma.category.findUnique({
        where: { id: categoryId },
      })
    : null;

  const billboards = await prisma.billboard.findMany({
    where: {
      storeId: storeId,
    },
  });

  // Fetch all categories for parent selection (exclude current category to prevent circular reference)
  const categories = await prisma.category.findMany({
    where: {
      storeId: storeId,
      ...(categoryId && isValidId ? { id: { not: categoryId } } : {}), // Exclude current category
    },
    select: {
      id: true,
      name: true,
      parentId: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryForm 
          billboards={billboards} 
          initialData={category}
          categories={categories}
        />
      </div>
    </div>
  );
};

export default CategoryPage;
