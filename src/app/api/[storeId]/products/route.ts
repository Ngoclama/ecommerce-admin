import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import slugify from "slugify";
import { API_MESSAGES, HTTP_STATUS, DEFAULTS } from "@/lib/constants";
import { devLog, devError } from "@/lib/api-utils";
import { revalidateStore } from "@/lib/revalidate-store";

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

    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }
    if (!storeId) {
      return new NextResponse(API_MESSAGES.STORE_ID_REQUIRED, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }
    if (!name) {
      return new NextResponse(API_MESSAGES.NAME_REQUIRED, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }
    if (!price) {
      return new NextResponse(API_MESSAGES.PRICE_REQUIRED, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }
    if (!categoryId) {
      return new NextResponse(API_MESSAGES.CATEGORY_ID_REQUIRED, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Kiểm tra variants
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return new NextResponse(API_MESSAGES.VARIANTS_REQUIRED, {
        status: HTTP_STATUS.BAD_REQUEST,
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
        isPublished:
          isPublished !== undefined ? isPublished : DEFAULTS.IS_PUBLISHED,
        categoryId,
        materialId: materialId || null,
        gender: gender || DEFAULTS.GENDER,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        tags: tags || [],
        trackQuantity:
          trackQuantity !== undefined ? trackQuantity : DEFAULTS.TRACK_QUANTITY,
        allowBackorder:
          allowBackorder !== undefined
            ? allowBackorder
            : DEFAULTS.ALLOW_BACKORDER,
        storeId: storeId,
        images: {
          createMany: {
            data: [...images.map((image: { url: string }) => image)],
          },
        },
        variants: {
          createMany: {
            data: variants.map(
              (v: {
                sizeId: string;
                colorId: string;
                materialId?: string | null;
                sku?: string | null;
                inventory: number;
                lowStockThreshold?: number;
                price?: number | null;
              }) => ({
                sizeId: v.sizeId,
                colorId: v.colorId,
                materialId: v.materialId || null,
                sku: v.sku || null,
                inventory: Number(v.inventory),
                lowStockThreshold:
                  Number(v.lowStockThreshold) || DEFAULTS.LOW_STOCK_THRESHOLD,
                price: v.price ? Number(v.price) : null,
              })
            ),
          },
        },
      },
    });

    // Trigger revalidation ở store
    await revalidateStore({ type: "product" });

    return NextResponse.json(product);
  } catch (error) {
    devError("[PRODUCTS_POST] Lỗi khi tạo sản phẩm:", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
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
      return new NextResponse(API_MESSAGES.STORE_ID_REQUIRED, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
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
    devError("[PRODUCTS_GET] Lỗi khi lấy danh sách sản phẩm:", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
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

    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId) {
      return new NextResponse(API_MESSAGES.UNAUTHORIZED, {
        status: HTTP_STATUS.FORBIDDEN,
      });
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
            message: "Không tìm thấy sản phẩm hợp lệ để xóa.",
          },
          { status: HTTP_STATUS.BAD_REQUEST }
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
      message: `Đã xóa thành công ${result.count} sản phẩm.`,
      count: result.count,
    });
  } catch (error: unknown) {
    devError("[PRODUCTS_DELETE_ALL_ERROR] Lỗi khi xóa sản phẩm:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return new NextResponse(
        "Không thể xóa sản phẩm do ràng buộc khóa ngoại. Một số sản phẩm có thể đã được liên kết với đơn hàng.",
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
