import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { BlogCategoryClient } from "./components/client";
import { BlogCategoryColumn } from "./components/columns";

const BlogCategoriesPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;

  const categories = await prisma.blogCategory.findMany({
    where: {
      storeId: storeId,
    },
    include: {
      blogPosts: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedCategories: BlogCategoryColumn[] = categories.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    postCount: item.blogPosts.length,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BlogCategoryClient data={formattedCategories} />
      </div>
    </div>
  );
};

export default BlogCategoriesPage;
