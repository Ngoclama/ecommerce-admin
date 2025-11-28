import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Lấy tất cả categories (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    // Lấy tất cả categories từ tất cả stores (public)
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        billboardId: true,
        createdAt: true,
        updatedAt: true,
        billboard: {
          select: {
            id: true,
            label: true,
            imageUrl: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
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
