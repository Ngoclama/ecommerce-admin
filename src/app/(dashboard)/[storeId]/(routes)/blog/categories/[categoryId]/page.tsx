import prisma from "@/lib/prisma";
import { CategoryForm } from "./components/category-form";
import { ObjectId } from "bson";

const BlogCategoryPage = async ({
  params,
}: {
  params: Promise<{ categoryId: string; storeId: string }>;
}) => {
  const { categoryId, storeId } = await params;
  const isValidId = ObjectId.isValid(categoryId);

  const category = isValidId
    ? await prisma.blogCategory.findUnique({
        where: { id: categoryId },
      })
    : null;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryForm initialData={category} />
      </div>
    </div>
  );
};

export default BlogCategoryPage;
