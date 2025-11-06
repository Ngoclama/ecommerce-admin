import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// CREATE PRODUCT
// ───────────────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
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
    } = body;

    // ─── Validate ─────────────────────────────
    if (!userId)
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

    if (!params.storeId)
      return NextResponse.json(
        { message: "Store ID is required" },
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

    if (!description?.trim())
      return NextResponse.json(
        { message: "Description is required" },
        { status: 400 }
      );

    if (!categoryId)
      return NextResponse.json(
        { message: "Category is required" },
        { status: 400 }
      );

    if (!sizeId)
      return NextResponse.json(
        { message: "Size is required" },
        { status: 400 }
      );

    if (!colorId)
      return NextResponse.json(
        { message: "Color is required" },
        { status: 400 }
      );

    // ─── Check quyền sở hữu store ─────────────
    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });

    if (!storeByUserId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    // ─── Ảnh fallback ─────────────────────────
    const finalImages =
      images && images.length > 0
        ? images
        : [{ url: "https://placehold.co/600x600?text=No+Image" }];

    // ─── Tạo product ─────────────────────────
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        isFeatured: !!isFeatured,
        isArchived: !!isArchived,
        sizeId,
        colorId,
        categoryId,
        storeId: params.storeId,
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
    console.error("[PRODUCTS_POST]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────
// GET PRODUCTS
// ───────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const colorId = searchParams.get("colorId") || undefined;
    const sizeId = searchParams.get("sizeId") || undefined;
    const isFeatured = searchParams.get("isFeatured") === "true";

    if (!params.storeId)
      return NextResponse.json(
        { message: "Store ID is required" },
        { status: 400 }
      );

    const products = await prisma.product.findMany({
      where: {
        storeId: params.storeId,
        categoryId,
        colorId,
        sizeId,
        isFeatured: isFeatured ? true : undefined,
        isArchived: false,
      },
      include: { images: true, category: true, color: true, size: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────
// DELETE ALL PRODUCTS
// ───────────────────────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId)
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });

    if (!storeByUserId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    await prisma.product.deleteMany({
      where: { storeId: params.storeId },
    });

    return NextResponse.json({ message: "All products deleted" });
  } catch (error) {
    console.error("[PRODUCTS_DELETE_ALL]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}
