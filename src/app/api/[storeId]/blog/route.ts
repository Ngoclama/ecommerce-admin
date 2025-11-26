import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";

// GET: Lấy danh sách blog posts
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Tối ưu: chỉ select các field cần thiết và giới hạn số lượng
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        storeId: storeId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        isPublished: true,
        publishedAt: true,
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
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Giới hạn số lượng để tối ưu
    });

    return NextResponse.json(blogPosts);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[BLOG_GET]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST: Tạo blog post mới
export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
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

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    if (!title || !content) {
      return new NextResponse("Title and content are required", {
        status: 400,
      });
    }

    // Generate slug từ title
    let baseSlug = slugify(title.trim(), {
      lower: true,
      strict: true,
      replacement: "-",
      remove: /[*+~.()'"!:@]/g,
    });

    // Validate slug không rỗng
    if (!baseSlug || baseSlug.trim() === "") {
      return new NextResponse(
        JSON.stringify({
          message: "Title cannot be converted to a valid slug",
          error: "INVALID_SLUG",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Kiểm tra category tồn tại (nếu có)
    let category = null;
    if (categoryId) {
      category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          storeId: storeId,
        },
        select: { id: true },
      });

      if (!category) {
        return new NextResponse(
          JSON.stringify({
            message: "Category not found",
            error: "CATEGORY_NOT_FOUND",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Tạo slug unique với retry logic và transaction để tránh race condition
    let finalSlug = baseSlug;
    let attempts = 0;
    const maxAttempts = 10;
    let slugAvailable = false;

    // Kiểm tra và tạo slug unique
    while (attempts < maxAttempts && !slugAvailable) {
      // Kiểm tra slug có tồn tại không
      const existingPost = await prisma.blogPost.findFirst({
        where: {
          slug: finalSlug,
          storeId: storeId,
        },
        select: { id: true },
      });

      if (!existingPost) {
        slugAvailable = true;
        break; // Slug is available
      }

      // Generate new slug với timestamp và random để đảm bảo unique
      // Sử dụng cả timestamp và random để tránh collision
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const shortTimestamp = timestamp.toString(36).slice(-6);
      finalSlug = `${baseSlug}-${shortTimestamp}-${random}`;

      // Đảm bảo slug không quá dài (MongoDB limit)
      if (finalSlug.length > 200) {
        finalSlug = finalSlug.substring(0, 200);
      }

      attempts++;
    }

    // Nếu vẫn không tìm được slug unique sau maxAttempts
    if (!slugAvailable) {
      // Fallback: sử dụng UUID-like string
      const uuid = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      finalSlug = `${baseSlug}-${uuid}`;
      if (finalSlug.length > 200) {
        finalSlug = finalSlug.substring(0, 200);
      }
    }

    // Validate final slug
    if (!finalSlug || finalSlug.trim() === "" || finalSlug.length > 255) {
      return new NextResponse(
        JSON.stringify({
          message: "Failed to generate valid slug",
          error: "SLUG_GENERATION_FAILED",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create blog post với transaction để đảm bảo atomicity
    // Nếu slug bị duplicate trong quá trình tạo, sẽ retry với slug mới
    let blogPost;
    let createAttempts = 0;
    const maxCreateAttempts = 5;
    let createSuccess = false;

    while (createAttempts < maxCreateAttempts && !createSuccess) {
      try {
        blogPost = await prisma.blogPost.create({
          data: {
            storeId,
            title: title.trim(),
            slug: finalSlug,
            content: content.trim(),
            excerpt: excerpt?.trim() || null,
            featuredImage: featuredImage?.trim() || null,
            metaTitle: metaTitle?.trim() || null,
            metaDescription: metaDescription?.trim() || null,
            tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
            isPublished: isPublished || false,
            publishedAt: isPublished ? new Date() : null,
            categoryId: categoryId || null,
          },
        });
        createSuccess = true;
      } catch (createError: any) {
        // Nếu lỗi là unique constraint violation (P2002), tạo slug mới và retry
        if (
          createError?.code === "P2002" &&
          createError?.meta?.target?.includes("slug")
        ) {
          createAttempts++;
          if (createAttempts < maxCreateAttempts) {
            // Tạo slug mới với timestamp và random
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 10);
            const shortTimestamp = timestamp.toString(36).slice(-8);
            finalSlug = `${baseSlug}-${shortTimestamp}-${random}`;
            if (finalSlug.length > 200) {
              finalSlug = finalSlug.substring(0, 200);
            }
            continue; // Retry với slug mới
          }
        }
        // Nếu không phải lỗi duplicate slug, throw error
        throw createError;
      }
    }

    // Nếu vẫn không tạo được sau maxCreateAttempts
    if (!createSuccess || !blogPost) {
      return new NextResponse(
        JSON.stringify({
          message:
            "Failed to create blog post after multiple attempts. Please try again.",
          error: "CREATE_FAILED",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(blogPost, { status: 201 });
  } catch (error: any) {
    // Improved error handling with detailed messages
    if (process.env.NODE_ENV === "development") {
      console.error("[BLOG_POST]", error);
    }

    // Handle Prisma specific errors
    if (error?.code === "P2002") {
      // Unique constraint violation (slug already exists)
      return new NextResponse(
        JSON.stringify({
          message: "A blog post with this slug already exists",
          error: "DUPLICATE_SLUG",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error?.code === "P2003") {
      // Foreign key constraint violation
      return new NextResponse(
        JSON.stringify({
          message: "Invalid category or store reference",
          error: "FOREIGN_KEY_ERROR",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error?.code === "P2011") {
      // Null constraint violation
      return new NextResponse(
        JSON.stringify({
          message: "Required fields are missing",
          error: "NULL_CONSTRAINT",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generic error with message in development
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? error?.message || "Internal server error"
        : "Internal server error";

    return new NextResponse(
      JSON.stringify({
        message: errorMessage,
        error: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// DELETE: Xóa tất cả blog posts
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Check if request body has specific IDs to delete
    let body: any = {};
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 0) {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const idsToDelete = body.ids;

    let blogIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific blog posts by IDs
      const blogPostsToDelete = await prisma.blogPost.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      blogIds = blogPostsToDelete.map((b) => b.id);

      if (blogIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid blog posts found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all blog posts (original behavior)
      const blogPostsToDelete = await prisma.blogPost.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      blogIds = blogPostsToDelete.map((b) => b.id);
    }

    const result = await prisma.blogPost.deleteMany({
      where: {
        id: { in: blogIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${result.count} blog posts.`,
      count: result.count,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[BLOG_DELETE_ALL_ERROR]", error);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
