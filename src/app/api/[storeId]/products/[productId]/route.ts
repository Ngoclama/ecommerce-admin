import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { API_MESSAGES, HTTP_STATUS, DEFAULTS } from "@/lib/constants";
import { devError } from "@/lib/api-utils";
import { revalidateStore } from "@/lib/revalidate-store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { productId } = await params;
    if (!productId) {
      return new NextResponse(API_MESSAGES.ID_REQUIRED, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Nếu productId là "new", trả về null (cho form tạo mới)
    if (productId === "new") {
      return NextResponse.json(null);
    }

    // Tối ưu: chỉ select các field cần thiết
    const product = await prisma.product.findUnique({
      where: { id: productId },
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
        gender: true,
        metaTitle: true,
        metaDescription: true,
        tags: true,
        trackQuantity: true,
        allowBackorder: true,
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
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
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

    // Disable cache for production - always return fresh data
    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { productId, storeId } = await params;
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
      variants,
    } = body;

    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }
    if (!name || !price || !categoryId || !variants?.length) {
      return new NextResponse(API_MESSAGES.VALIDATION_ERROR, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Check authorization
    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    // Update transaction
    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        categoryId,
        description,
        isFeatured,
        isArchived,
        isPublished:
          isPublished !== undefined ? isPublished : DEFAULTS.IS_PUBLISHED,
        materialId: materialId || null,
        gender,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        tags: tags || [],
        trackQuantity:
          trackQuantity !== undefined ? trackQuantity : DEFAULTS.TRACK_QUANTITY,
        allowBackorder:
          allowBackorder !== undefined
            ? allowBackorder
            : DEFAULTS.ALLOW_BACKORDER,
        images: { deleteMany: {} }, // Xóa ảnh cũ
        variants: { deleteMany: {} }, // Xóa variant cũ
      },
    });

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        images: {
          createMany: { data: [...images.map((img: { url: string }) => img)] },
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
      include: { variants: true },
    });

    // Trigger revalidation ở store
    await revalidateStore({ type: "product" });

    return NextResponse.json(product);
  } catch (error) {
    devError("[PRODUCT_PATCH] Lỗi khi cập nhật sản phẩm:", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { productId, storeId } = await params;
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    // Check authorization
    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    // Kiểm tra xem có OrderItem nào đang sử dụng sản phẩm này không
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId },
    });

    if (orderItemsCount > 0) {
      return new NextResponse(
        JSON.stringify({
          error: "Không thể xóa sản phẩm",
          message: `Sản phẩm này đang được sử dụng trong ${orderItemsCount} đơn hàng. Vui lòng archive sản phẩm thay vì xóa để giữ lại lịch sử đơn hàng.`,
          orderItemsCount,
        }),
        {
          status: HTTP_STATUS.BAD_REQUEST,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await prisma.product.delete({ where: { id: productId } });

    // Trigger revalidation ở store
    await revalidateStore({ type: "product" });

    return NextResponse.json({ message: API_MESSAGES.DELETED });
  } catch (error) {
    devError("[PRODUCT_DELETE] Lỗi khi xóa sản phẩm:", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
