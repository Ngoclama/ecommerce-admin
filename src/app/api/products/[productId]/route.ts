import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Lấy một sản phẩm theo ID (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[PRODUCT_PUBLIC_GET] Fetching product:", productId);
    }

    // Hỗ trợ tìm kiếm bằng cả id (ObjectId) hoặc slug
    // ObjectId có độ dài 24 ký tự, slug thường ngắn hơn
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId);

    const product = await prisma.product.findFirst({
      where: {
        ...(isObjectId ? { id: productId } : { slug: productId }),
        isArchived: false,
        isPublished: true, // Chỉ lấy sản phẩm đã publish
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
        storeId: true,
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
            billboard: {
              select: {
                id: true,
                label: true,
                imageUrl: true,
              },
            },
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
            lowStockThreshold: true,
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
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_PUBLIC_GET] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    if (process.env.NODE_ENV === "development") {
      console.error("[PRODUCT_PUBLIC_GET] Full error:", error);
    }
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
