import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { productId } = await params;
    if (!productId) return new NextResponse("ID required", { status: 400 });

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

    return NextResponse.json(product);
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

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!name || !price || !categoryId || !variants?.length) {
      return new NextResponse("Missing data", { status: 400 });
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
        isPublished: isPublished !== undefined ? isPublished : true,
        materialId: materialId || null,
        gender,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        tags: tags || [],
        trackQuantity: trackQuantity !== undefined ? trackQuantity : true,
        allowBackorder: allowBackorder !== undefined ? allowBackorder : false,
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
      include: { variants: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[PRODUCT_PATCH]", error);
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { productId, storeId } = await params;
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Check authorization
    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
