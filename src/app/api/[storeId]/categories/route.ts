import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import slugify from "slugify";
import { API_MESSAGES, HTTP_STATUS } from "@/lib/constants";
import { devError } from "@/lib/api-utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();
    const { name, billboardId, slug, parentId, imageUrl } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: API_MESSAGES.UNAUTHENTICATED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }
    if (!name) {
      return NextResponse.json(
        { success: false, message: API_MESSAGES.NAME_REQUIRED },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    if (!billboardId) {
      return NextResponse.json(
        { success: false, message: "ID billboard là bắt buộc" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    if (!storeId) {
      return NextResponse.json(
        { success: false, message: API_MESSAGES.STORE_ID_REQUIRED },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!store)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    const existingCategory = await prisma.category.findFirst({
      where: {
        storeId: storeId,
        name: name,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: "Category name already exists." },
        { status: 409 }
      );
    }
    const finalSlug = slug
      ? slug
      : slugify(name, { lower: true, strict: true });

    const existingCategoryBySlug = await prisma.category.findFirst({
      where: {
        storeId: storeId,
        slug: finalSlug,
      },
    });

    if (existingCategoryBySlug) {
      return NextResponse.json(
        {
          message:
            "Generated slug already exists. Please use a different name.",
        },
        { status: 409 }
      );
    }

    // Validate parentId if provided
    if (parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: parentId,
          storeId: storeId,
        },
      });
      if (!parentCategory) {
        return NextResponse.json(
          { success: false, message: "Parent category not found" },
          { status: 400 }
        );
      }
      // Prevent circular reference: check if parentId is a child of current category
      // (This check is mainly for updates, but we include it here for safety)
    }

    // Disallow imageUrl for child categories (only allow for top-level)
    if (parentId) {
      if (imageUrl) {
        return NextResponse.json(
          {
            success: false,
            message: "Danh mục con không thể có ảnh riêng (imageUrl).",
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        billboardId,
        storeId: storeId,
        parentId: parentId || null,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[CATEGORY_POST]", error);
    }
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    if (!storeId)
      return NextResponse.json(
        { success: false, message: "Store ID is required" },
        { status: 400 }
      );

    // Tối ưu: chỉ select các field cần thiết
    const categories = await prisma.category.findMany({
      where: { storeId: storeId },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        billboardId: true,
        parentId: true,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      devError("[CATEGORY_GET] Lỗi khi lấy danh sách categories:", error);
    }
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();

    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 }
      );

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );

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

    let categoryIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific categories by IDs
      // Verify all IDs belong to this store
      const categoriesToDelete = await prisma.category.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      categoryIds = categoriesToDelete.map((c) => c.id);

      if (categoryIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No valid categories found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all categories (original behavior)
      const categoriesToDelete = await prisma.category.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      categoryIds = categoriesToDelete.map((c) => c.id);
    }

    if (categoryIds.length > 0) {
      // 1. Xóa tất cả products của các categories này (có cascade delete)
      // Products sẽ tự động xóa variants, images, reviews, etc.
      await prisma.product.deleteMany({
        where: { categoryId: { in: categoryIds } },
      });
    }

    // 2. Xóa các categories đã chọn
    const deleted = await prisma.category.deleteMany({
      where: {
        id: { in: categoryIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} categories successfully.`,
      count: deleted.count,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[CATEGORY_DELETE_ALL_ERROR]", error);
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete categories because they are linked to existing products.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
