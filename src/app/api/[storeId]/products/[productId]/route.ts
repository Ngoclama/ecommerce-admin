import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────
// GET: Lấy chi tiết 1 sản phẩm
// ─────────────────────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    if (!params.productId)
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );

    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      include: {
        images: true,
        category: true,
        size: true,
        color: true,
        material: true, // 👈 THÊM DÒNG NÀY: Để lấy thông tin chất liệu
      },
    });

    if (!product)
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH: Cập nhật sản phẩm
// ─────────────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();

    const {
      name,
      price,
      description,
      categoryId,
      colorId,
      sizeId,
      images,
      isFeatured,
      isArchived,
      // 👇 THÊM: Lấy dữ liệu mới từ form gửi lên
      inventory,
      materialId,
      gender,
    } = body;

    // ─── Basic validation ─────────────────────────────
    if (!userId)
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

    if (!params.storeId || !params.productId)
      return NextResponse.json(
        { message: "Store ID and Product ID are required" },
        { status: 400 }
      );

    if (!name?.trim())
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );

    if (!price || isNaN(Number(price)))
      return NextResponse.json(
        { message: "Price is required and must be a number" },
        { status: 400 }
      );

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });

    if (!storeByUserId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    // ─── Xử lý ảnh ─────────────────────────────────────
    const finalImages =
      images && images.length > 0
        ? images
        : [{ url: "https://placehold.co/600x600?text=No+Image" }];

    // 1️⃣ Xoá toàn bộ ảnh cũ
    await prisma.image.deleteMany({
      where: { productId: params.productId },
    });

    // 2️⃣ Cập nhật sản phẩm
    const product = await prisma.product.update({
      where: { id: params.productId },
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        isFeatured: !!isFeatured,
        isArchived: !!isArchived,
        categoryId,
        colorId,
        sizeId,
        // 👇 THÊM: Cập nhật các trường mới
        inventory: Number(inventory) || 10, // Default là 10
        gender: gender || "UNISEX", // Default là UNISEX
        materialId: materialId || null, // Nếu không chọn thì set null

        images: {
          createMany: {
            data: finalImages.map((image: { url: string }) => ({
              url: image.url,
            })),
          },
        },
      },
      include: { images: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_PATCH]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE: Xóa sản phẩm (Giữ nguyên không đổi)
// ─────────────────────────────────────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });
    if (!storeByUserId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    const product = await prisma.product.delete({
      where: { id: params.productId },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}
