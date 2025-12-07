import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import slugify from "slugify";
import { API_MESSAGES, HTTP_STATUS, DEFAULTS } from "@/lib/constants";
import { devLog, devError } from "@/lib/api-utils";

/**
 * ═══════════════════════════════════════════════════════════════
 * IMPROVED PRODUCT API - WITH TRANSACTION SUPPORT
 * ═══════════════════════════════════════════════════════════════
 *
 * KEY IMPROVEMENTS:
 * 1. ✅ Transaction support - atomic operations
 * 2. ✅ Better error handling with detailed messages
 * 3. ✅ Validation for business rules
 * 4. ✅ Vietnamese error messages
 * 5. ✅ Prevent data inconsistency
 */

// ═══════════════════════════════════════════════════════════════
// POST: Tạo sản phẩm mới - WITH TRANSACTION
// ═══════════════════════════════════════════════════════════════
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
      variants,
    } = body;

    // ═══ AUTHENTICATION & AUTHORIZATION ═══
    if (!userId) {
      return NextResponse.json(
        { error: "Chưa đăng nhập", message: "Vui lòng đăng nhập để tiếp tục" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    if (!storeId) {
      return NextResponse.json(
        { error: "Thiếu ID cửa hàng", message: "Store ID là bắt buộc" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Verify store ownership
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return NextResponse.json(
        {
          error: "Không có quyền",
          message: "Bạn không có quyền truy cập cửa hàng này",
        },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // ═══ INPUT VALIDATION ═══
    const validationErrors: string[] = [];

    if (!name?.trim()) {
      validationErrors.push("Tên sản phẩm là bắt buộc");
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      validationErrors.push("Giá sản phẩm phải lớn hơn 0");
    }
    if (!categoryId) {
      validationErrors.push("Danh mục là bắt buộc");
    }
    if (!images || !Array.isArray(images) || images.length === 0) {
      validationErrors.push("Cần ít nhất 1 hình ảnh");
    }
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      validationErrors.push("Cần ít nhất 1 biến thể sản phẩm");
    }

    // Validate compareAtPrice if provided
    if (compareAtPrice && Number(compareAtPrice) <= Number(price)) {
      validationErrors.push("Giá so sánh phải lớn hơn giá bán");
    }

    // Validate variants
    if (variants && Array.isArray(variants)) {
      variants.forEach((v, index) => {
        if (!v.sizeId)
          validationErrors.push(`Biến thể ${index + 1}: thiếu kích thước`);
        if (!v.colorId)
          validationErrors.push(`Biến thể ${index + 1}: thiếu màu sắc`);
        if (v.inventory === undefined || v.inventory < 0) {
          validationErrors.push(
            `Biến thể ${index + 1}: số lượng tồn kho không hợp lệ`
          );
        }
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ",
          message: validationErrors.join(". "),
          errors: validationErrors,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ═══ BUSINESS LOGIC VALIDATION ═══
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        {
          error: "Danh mục không tồn tại",
          message: "Vui lòng chọn danh mục hợp lệ",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Verify sizes and colors exist
    // Validate sizes and colors exist
    const sizeIds = [
      ...new Set(variants.map((v: any) => v.sizeId)),
    ] as string[];
    const colorIds = [
      ...new Set(variants.map((v: any) => v.colorId)),
    ] as string[];

    const [sizesCount, colorsCount] = await Promise.all([
      prisma.size.count({ where: { id: { in: sizeIds } } }),
      prisma.color.count({ where: { id: { in: colorIds } } }),
    ]);

    if (sizesCount !== sizeIds.length) {
      return NextResponse.json(
        {
          error: "Kích thước không hợp lệ",
          message: "Một số kích thước không tồn tại",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (colorsCount !== colorIds.length) {
      return NextResponse.json(
        {
          error: "Màu sắc không hợp lệ",
          message: "Một số màu sắc không tồn tại",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // ═══ GENERATE UNIQUE SLUG ═══
    let slug = slugify(name, { lower: true, strict: true });
    const existingProduct = await prisma.product.findUnique({
      where: { storeId_slug: { storeId, slug } },
    });

    if (existingProduct) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // ═══ CREATE PRODUCT WITH TRANSACTION ═══
    // This ensures atomicity - either all succeed or all fail
    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          name: name.trim(),
          slug,
          price: Number(price),
          compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
          description: description || "",
          isFeatured: Boolean(isFeatured),
          isArchived: Boolean(isArchived),
          isPublished:
            isPublished !== undefined
              ? Boolean(isPublished)
              : DEFAULTS.IS_PUBLISHED,
          categoryId,
          materialId: materialId || null,
          gender: gender || DEFAULTS.GENDER,
          metaTitle: metaTitle?.trim() || null,
          metaDescription: metaDescription?.trim() || null,
          tags: tags || [],
          trackQuantity:
            trackQuantity !== undefined
              ? Boolean(trackQuantity)
              : DEFAULTS.TRACK_QUANTITY,
          allowBackorder:
            allowBackorder !== undefined
              ? Boolean(allowBackorder)
              : DEFAULTS.ALLOW_BACKORDER,
          storeId,
        },
      });

      // Create images
      await tx.image.createMany({
        data: images.map((img: { url: string }) => ({
          url: img.url,
          productId: newProduct.id,
        })),
      });

      // Create variants
      await tx.productVariant.createMany({
        data: variants.map((v: any) => ({
          productId: newProduct.id,
          sizeId: v.sizeId,
          colorId: v.colorId,
          materialId: v.materialId || null,
          sku: v.sku?.trim() || null,
          inventory: Number(v.inventory),
          lowStockThreshold: v.lowStockThreshold
            ? Number(v.lowStockThreshold)
            : DEFAULTS.LOW_STOCK_THRESHOLD,
          price: v.price ? Number(v.price) : null,
        })),
      });

      // Return product with relations
      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          images: true,
          variants: {
            include: {
              size: true,
              color: true,
              material: true,
            },
          },
          category: true,
          material: true,
        },
      });
    });

    devLog("[PRODUCTS_POST] Sản phẩm được tạo:", product?.id);

    return NextResponse.json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: product,
    });
  } catch (error: any) {
    devError("[PRODUCTS_POST] Lỗi:", error);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Trùng lặp dữ liệu",
          message: "Sản phẩm với slug này đã tồn tại",
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "Dữ liệu không hợp lệ",
          message: "Một số dữ liệu tham chiếu không tồn tại",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    return NextResponse.json(
      {
        error: "Lỗi server",
        message: "Không thể tạo sản phẩm. Vui lòng thử lại sau.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Continue with GET, DELETE... (similar improvements)
