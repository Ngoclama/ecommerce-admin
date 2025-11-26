import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import slugify from "slugify";

// ───────────────────────────────────────────────
// POST: Tạo sản phẩm mới
// ───────────────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const {
      name,
      price,
      description,
      categoryId,
      images,
      isFeatured,
      isArchived,
      isPublished,
      materialId,
      gender,
      compareAtPrice,
      metaTitle,
      metaDescription,
      tags,
      trackQuantity,
      allowBackorder,
      variants, // Nhận mảng variants từ form
    } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!storeId)
      return new NextResponse("Store ID is required", { status: 400 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!price) return new NextResponse("Price is required", { status: 400 });
    if (!categoryId)
      return new NextResponse("Category ID is required", { status: 400 });

    // Kiểm tra variants
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return new NextResponse("At least one variant is required", {
        status: 400,
      });
    }

    // 1. Tự động tạo Slug từ Name
    let slug = slugify(name, { lower: true, strict: true });

    // Kiểm tra trùng slug trong store
    const existingProduct = await prisma.product.findUnique({
      where: {
        storeId_slug: {
          // Lỗi này sẽ hết sau khi npx prisma generate
          storeId: storeId,
          slug: slug,
        },
      },
    });

    // Nếu trùng thì thêm random string
    if (existingProduct) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // 2. Tạo Product cùng với Variants & Images
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        description,
        isFeatured: isFeatured ? true : false,
        isArchived: isArchived ? true : false,
        isPublished: isPublished !== undefined ? isPublished : true,
        categoryId,
        materialId: materialId || null,
        gender: gender || "UNISEX",
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        tags: tags || [],
        trackQuantity: trackQuantity !== undefined ? trackQuantity : true,
        allowBackorder: allowBackorder !== undefined ? allowBackorder : false,
        storeId: storeId,
        images: {
          createMany: {
            data: [...images.map((image: { url: string }) => image)],
          },
        },
        variants: {
          createMany: {
            data: variants.map((v: any) => ({
              sizeId: v.sizeId,
              colorId: v.colorId,
              materialId: v.materialId || null,
              sku: v.sku || null,
              inventory: Number(v.inventory),
              lowStockThreshold: Number(v.lowStockThreshold) || 10,
              price: v.price ? Number(v.price) : null,
            })),
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[PRODUCTS_POST]", error);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ───────────────────────────────────────────────
// GET: Lấy danh sách sản phẩm (Có lọc theo Variants)
// ───────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const colorId = searchParams.get("colorId") || undefined;
    const sizeId = searchParams.get("sizeId") || undefined;
    const isFeatured = searchParams.get("isFeatured");

    if (!storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    // Tối ưu: chỉ select các field cần thiết
    const products = await prisma.product.findMany({
      where: {
        storeId: storeId,
        categoryId,
        isFeatured: isFeatured ? true : undefined,
        isArchived: false,
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
      console.log("[PRODUCTS_GET]", error);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ───────────────────────────────────────────────
// DELETE: Xóa tất cả sản phẩm
// ───────────────────────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId } = await auth();
    const { storeId } = await params;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

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

    let productIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific products by IDs
      const productsToDelete = await prisma.product.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      productIds = productsToDelete.map((p) => p.id);

      if (productIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid products found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all products (original behavior)
      const productsToDelete = await prisma.product.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      productIds = productsToDelete.map((p) => p.id);
    }

    if (productIds.length > 0) {
      // 1. Xóa OrderItem (không có cascade delete)
      await prisma.orderItem.deleteMany({
        where: { productId: { in: productIds } },
      });

      // 2. Các relation khác có onDelete: Cascade sẽ tự động xóa:
      // - ProductVariant
      // - Image
      // - Review
      // - Wishlist
      // - CartItem
    }

    // 3. Xóa các products đã chọn
    const result = await prisma.product.deleteMany({
      where: {
        id: { in: productIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted all products.`,
      count: result.count,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[PRODUCTS_DELETE_ALL_ERROR]", error);
    }

    if (error.code === "P2003") {
      return new NextResponse(
        "Failed to delete products due to foreign key constraints. Some products may be linked to orders.",
        { status: 400 }
      );
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
