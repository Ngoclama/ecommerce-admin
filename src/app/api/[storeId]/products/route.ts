import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
// ───────────────────────────────────────────────
// CREATE PRODUCT
// ───────────────────────────────────────────────
// Định nghĩa Schema Validation
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  colorId: z.string().min(1, "Color is required"),
  sizeId: z.string().min(1, "Size is required"),
  isFeatured: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  images: z
    .array(z.object({ url: z.string() }))
    .min(1, "At least one image is required"),
});

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
      inventory, // Thêm trường này
    } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 });
    if (!name) return new NextResponse("Name is required", { status: 400 });

    // 1. Tự động tạo Slug
    let slug = slugify(name, { lower: true, strict: true });

    // Kiểm tra xem slug đã tồn tại trong store này chưa
    const existingProduct = await prisma.product.findUnique({
      where: {
        storeId_slug: {
          storeId: params.storeId,
          slug: slug,
        },
      },
    });

    // Nếu trùng thì thêm random string vào đuôi
    if (existingProduct) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // 2. Tạo sản phẩm với Slug và Inventory
    const product = await prisma.product.create({
      data: {
        name,
        slug, // Lưu slug
        price: Number(price), // Đảm bảo là số
        description,
        isFeatured: isFeatured ? true : false,
        isArchived: isArchived ? true : false,
        inventory: inventory ? Number(inventory) : 10, // Default 10 nếu không nhập
        categoryId,
        colorId,
        sizeId,
        storeId: params.storeId,
        images: {
          createMany: {
            data: [...images.map((image: { url: string }) => image)],
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log("[PRODUCTS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const colorId = searchParams.get("colorId") || undefined;
    const sizeId = searchParams.get("sizeId") || undefined;
    const isFeatured = searchParams.get("isFeatured");

    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: {
        storeId: params.storeId,
        categoryId,
        colorId,
        sizeId,
        isFeatured: isFeatured ? true : undefined,
        isArchived: false, // Chỉ lấy sản phẩm chưa bị ẩn
      },
      include: {
        images: true,
        category: true,
        color: true,
        size: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.log("[PRODUCTS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
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
