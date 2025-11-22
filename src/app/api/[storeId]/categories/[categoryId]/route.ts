import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import slugify from "slugify";

export async function GET(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    if (!params.categoryId) {
      return new NextResponse("Category id is required", { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: {
        id: params.categoryId,
      },
      include: {
        billboard: true,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.log("[CATEGORY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; categoryId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name, billboardId, slug } = body;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!billboardId)
      return new NextResponse("Billboard ID is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    // 👇 BƯỚC 2: KIỂM TRA TRÙNG TÊN (TRỪ CHÍNH NÓ)
    const existingCategory = await prisma.category.findFirst({
      where: {
        storeId: params.storeId,
        name: name,
        id: {
          not: params.categoryId, // Quan trọng: Không check chính nó
        },
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
            storeId: params.storeId,
            slug: finalSlug,
            id: {
                not: params.categoryId,
            },
        },
    });

    if (existingCategoryBySlug) {
        return NextResponse.json(
            { message: "Generated slug already exists. Please use a different name." },
            { status: 409 }
        );
    }

    const category = await prisma.category.update({
      where: { id: params.categoryId },
      data: { name, billboardId, slug: finalSlug },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_PATCH]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string; categoryId: string } }
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

    const category = await prisma.category.delete({
      where: { id: params.categoryId },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_DELETE]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}
