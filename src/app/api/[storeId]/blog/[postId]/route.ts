import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";
import { revalidateStore } from "@/lib/revalidate-store";

// GET: Lấy chi tiết blog post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string; postId: string }> }
) {
  try {
    const { storeId, postId } = await params;

    if (!postId) {
      return new NextResponse("Post ID is required", { status: 400 });
    }

    // Tối ưu: chỉ select các field cần thiết
    const blogPost = await prisma.blogPost.findFirst({
      where: {
        id: postId,
        storeId: storeId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        featuredImage: true,
        metaTitle: true,
        metaDescription: true,
        tags: true,
        isPublished: true,
        publishedAt: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!blogPost) {
      return new NextResponse("Blog post not found", { status: 404 });
    }

    return NextResponse.json(blogPost);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[BLOG_POST_GET]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH: Cập nhật blog post
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; postId: string }> }
) {
  try {
    const { storeId, postId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const {
      title,
      content,
      excerpt,
      featuredImage,
      metaTitle,
      metaDescription,
      tags,
      categoryId,
      isPublished,
    } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Chạy song song: kiểm tra store, lấy blogPost, và kiểm tra category
    const [store, blogPost, category] = await Promise.all([
      prisma.store.findFirst({
        where: { id: storeId, userId },
        select: { id: true }, // Chỉ select id để tối ưu
      }),
      prisma.blogPost.findFirst({
        where: {
          id: postId,
          storeId: storeId, // Filter theo storeId ngay từ đầu
        },
        select: {
          id: true,
          title: true,
          slug: true,
          publishedAt: true,
        },
      }),
      categoryId
        ? prisma.category.findFirst({
            where: {
              id: categoryId,
              storeId: storeId,
            },
            select: { id: true }, // Chỉ select id để tối ưu
          })
        : Promise.resolve(null),
    ]);

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    if (!blogPost) {
      return new NextResponse("Blog post not found", { status: 404 });
    }

    // Generate new slug if title changed
    let slug = blogPost.slug;
    const needsSlugCheck = title && title !== blogPost.title;

    // Kiểm tra slug nếu cần
    if (needsSlugCheck) {
      const newSlug = slugify(title, { lower: true, strict: true });
      const existingPost = await prisma.blogPost.findFirst({
        where: {
          slug: newSlug,
          storeId: storeId,
          id: { not: postId },
        },
        select: { id: true },
      });

      if (existingPost) {
        slug = `${newSlug}-${Math.random().toString(36).substring(2, 7)}`;
      } else {
        slug = newSlug;
      }
    }

    // Kiểm tra category tồn tại
    if (categoryId && !category) {
      return new NextResponse("Category not found", { status: 404 });
    }

    // Update blog post - không include category để tối ưu
    const result = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title: title || undefined,
        slug: slug || undefined,
        content: content || undefined,
        excerpt: excerpt !== undefined ? excerpt : undefined,
        featuredImage: featuredImage !== undefined ? featuredImage : undefined,
        metaTitle: metaTitle !== undefined ? metaTitle : undefined,
        metaDescription:
          metaDescription !== undefined ? metaDescription : undefined,
        tags: tags || undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined,
        publishedAt:
          isPublished === true && !blogPost.publishedAt
            ? new Date()
            : undefined,
      },
      // Loại bỏ include để tối ưu - có thể fetch sau nếu cần
    });

    // Trigger revalidation ở store
    await revalidateStore({ type: "blog" });

    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[BLOG_POST_PATCH]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE: Xóa blog post
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; postId: string }> }
) {
  try {
    const { storeId, postId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Chạy song song: kiểm tra store và blogPost
    const [store, blogPost] = await Promise.all([
      prisma.store.findFirst({
        where: { id: storeId, userId },
        select: { id: true }, // Chỉ select id để tối ưu
      }),
      prisma.blogPost.findFirst({
        where: {
          id: postId,
          storeId: storeId, // Filter theo storeId ngay từ đầu
        },
        select: { id: true }, // Chỉ select id để tối ưu
      }),
    ]);

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    if (!blogPost) {
      return new NextResponse("Blog post not found", { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { id: postId },
    });

    // Trigger revalidation ở store
    await revalidateStore({ type: "blog" });

    return NextResponse.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[BLOG_POST_DELETE]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
