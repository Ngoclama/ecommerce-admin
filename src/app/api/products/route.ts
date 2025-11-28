import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Lấy tất cả sản phẩm (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const colorId = searchParams.get("colorId") || undefined;
    const sizeId = searchParams.get("sizeId") || undefined;
    const isFeatured = searchParams.get("isFeatured");

    // Tối ưu: chỉ select các field cần thiết
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        isFeatured: isFeatured ? true : undefined,
        isArchived: false,
        isPublished: true, // Chỉ lấy sản phẩm đã publish
        variants:
          sizeId || colorId
            ? {
                some: {
                  sizeId: sizeId || undefined,
                  colorId: colorId || undefined,
                },
              }
            : undefined,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        description: true,
        isFeatured: true,
        isArchived: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        images: {
          select: {
            id: true,
            url: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        material: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            inventory: true,
            price: true,
            size: {
              select: {
                id: true,
                name: true,
                value: true,
              },
            },
            color: {
              select: {
                id: true,
                name: true,
                value: true,
              },
            },
            material: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Giới hạn số lượng để tránh query quá lớn
    });

    return NextResponse.json(products);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[PRODUCTS_PUBLIC_GET]", error);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

