import prisma from "@/lib/prisma";
import { BlogForm } from "./components/blog-form";
import { ObjectId } from "bson";

const BlogPostPage = async ({
  params,
}: {
  params: Promise<{ postId: string; storeId: string }>;
}) => {
  const { postId, storeId } = await params;
  const isValidId = ObjectId.isValid(postId);

  const blogPost = isValidId
    ? await prisma.blogPost.findUnique({
        where: { id: postId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })
    : null;

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <BlogForm initialData={blogPost} />
      </div>
    </div>
  );
};

export default BlogPostPage;
