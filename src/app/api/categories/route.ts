import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { API_MESSAGES, HTTP_STATUS, PAGINATION } from "@/lib/constants";
import { devError } from "@/lib/api-utils";

// ───────────────────────────────────────────────
// GET: Public API - Lấy tất cả categories (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    // Lấy tất cả categories từ tất cả stores (public)
    // Tối ưu: chỉ select các field cần thiết, không include _count để giảm query time
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        billboardId: true,
        parentId: true,
        billboard: {
          select: {
            id: true,
            label: true,
            imageUrl: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        name: "asc", // Sort by name instead of createdAt for better performance
      },
      take: PAGINATION.MAX_LIMIT * 10, // Giới hạn để tránh query quá lớn
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    devError(
      "[CATEGORIES_PUBLIC_GET] Lỗi khi lấy danh sách categories:",
      error
    );
    return NextResponse.json(
      { success: false, message: API_MESSAGES.SERVER_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
