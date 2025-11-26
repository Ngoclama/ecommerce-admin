import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { BlogClient } from "./components/client";
import { BlogPostColumn } from "./components/columns";

const BlogPage = async ({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) => {
  const { storeId } = await params;

  const blogPosts = await prisma.blogPost.findMany({
    where: {
      storeId: storeId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedPosts: BlogPostColumn[] = blogPosts.map((item: any) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    categoryName: item.category?.name || "No category",
    isPublished: item.isPublished,
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BlogClient data={formattedPosts} />
      </div>
    </div>
  );
};

export default BlogPage;
