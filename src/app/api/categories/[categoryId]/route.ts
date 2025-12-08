import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Lấy category theo ID (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "Category ID is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
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
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Disable cache for production - always return fresh data
    return NextResponse.json(category, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[CATEGORY_PUBLIC_GET]", error);
    }
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
