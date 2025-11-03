import prisma from "@/lib/prisma";
import { CategoryForm } from "./components/category-form";
import { ObjectId } from "bson";

const CategoryPage = async ({
  params,
}: {
  params: { categoryId: string; storeId: string };
}) => {
  const isValidId = ObjectId.isValid(params.categoryId);

  const category = isValidId
    ? await prisma.category.findUnique({
        where: { id: params.categoryId },
      })
    : null;

  const billboards = await prisma.billboard.findMany({
    where: {
      storeId: params.storeId,
    },
  });
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryForm initialData={category} billboards={billboards} />
      </div>
    </div>
  );
};

export default CategoryPage;
