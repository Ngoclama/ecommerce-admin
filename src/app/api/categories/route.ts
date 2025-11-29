import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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
      take: 1000, // Limit to prevent huge queries
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[CATEGORIES_PUBLIC_GET]", error);
    }
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
