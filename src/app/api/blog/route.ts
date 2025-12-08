import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { API_MESSAGES, HTTP_STATUS, PAGINATION } from "@/lib/constants";
import { devError } from "@/lib/api-utils";

// ───────────────────────────────────────────────
// GET: Public API - Lấy tất cả blog posts đã published (không cần authentication)
// ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const searchQuery =
      searchParams.get("q") || searchParams.get("search") || undefined;
    const page = parseInt(
      searchParams.get("page") || String(PAGINATION.DEFAULT_PAGE)
    );
    const limit = Math.min(
      parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT)),
      PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện tìm kiếm
    const where: any = {
      isPublished: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (searchQuery && searchQuery.trim()) {
      where.OR = [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { excerpt: { contains: searchQuery, mode: "insensitive" } },
        { content: { contains: searchQuery, mode: "insensitive" } },
        { tags: { has: searchQuery } },
      ];
    }

    // Tối ưu: chỉ select các field cần thiết
    const blogPosts = await prisma.blogPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
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
      orderBy: {
        publishedAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.blogPost.count({
      where,
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Disable cache for production - always return fresh data
    const cacheHeaders = {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    };

    // If no pagination params provided, return simple array for backward compatibility
    const hasPaginationParams =
      searchParams.get("page") || searchParams.get("limit");

    if (!hasPaginationParams && limit === 10) {
      return NextResponse.json(blogPosts, { headers: cacheHeaders });
    }

    return NextResponse.json(
      {
        success: true,
        data: blogPosts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      },
      { headers: cacheHeaders }
    );
  } catch (error) {
    devError("[BLOG_PUBLIC_GET] Lỗi khi lấy danh sách blog posts:", error);
    return NextResponse.json(
      { success: false, message: API_MESSAGES.SERVER_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
