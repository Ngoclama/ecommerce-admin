import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { devError } from "@/lib/api-utils";

// ───────────────────────────────────────────────
// GET: Public API - Lấy chi tiết blog post theo slug (không cần authentication)
// ───────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return new NextResponse("Slug is required", { status: 400 });
    }

    // Tối ưu: chỉ select các field cần thiết
    const blogPost = await prisma.blogPost.findFirst({
      where: {
        slug: slug,
        isPublished: true, // Chỉ lấy blog đã published
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
    });

    if (!blogPost) {
      return new NextResponse("Blog post not found", { status: 404 });
    }

    // Disable cache for production - always return fresh data
    return NextResponse.json(blogPost, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    devError("[BLOG_PUBLIC_GET_SLUG] Lỗi khi lấy blog post:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
