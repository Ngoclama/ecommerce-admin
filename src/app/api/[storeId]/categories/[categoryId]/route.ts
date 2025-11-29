import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import slugify from "slugify";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    if (!categoryId) {
      return new NextResponse("Category id is required", { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
      include: {
        billboard: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
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
  { params }: { params: Promise<{ storeId: string; categoryId: string }> }
) {
  try {
    const { storeId, categoryId } = await params;
    const { userId } = await auth();
    const body = await req.json();
    const { name, billboardId, slug, parentId } = body;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!billboardId)
      return new NextResponse("Billboard ID is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    // 👇 BƯỚC 2: KIỂM TRA TRÙNG TÊN (TRỪ CHÍNH NÓ)
    const existingCategory = await prisma.category.findFirst({
      where: {
        storeId: storeId,
        name: name,
        id: {
          not: categoryId, // Quan trọng: Không check chính nó
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
        storeId: storeId,
        slug: finalSlug,
        id: {
          not: categoryId,
        },
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
      // Prevent setting self as parent
      if (parentId === categoryId) {
        return NextResponse.json(
          { message: "Category cannot be its own parent" },
          { status: 400 }
        );
      }

      const parentCategory = await prisma.category.findFirst({
        where: {
          id: parentId,
          storeId: storeId,
        },
      });
      if (!parentCategory) {
        return NextResponse.json(
          { message: "Parent category not found" },
          { status: 400 }
        );
      }

      // Prevent circular reference: check if parentId is a descendant of current category
      const checkCircularReference = async (
        checkId: string,
        depth: number = 0
      ): Promise<boolean> => {
        if (depth > 10) return true; // Prevent infinite loop
        if (checkId === categoryId) return true; // Circular reference found

        const category = await prisma.category.findUnique({
          where: { id: checkId },
          select: { parentId: true },
        });

        if (!category || !category.parentId) return false;
        return checkCircularReference(category.parentId, depth + 1);
      };

      const hasCircularRef = await checkCircularReference(parentId);
      if (hasCircularRef) {
        return NextResponse.json(
          { message: "Cannot set parent: would create circular reference" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        billboardId,
        slug: finalSlug,
        parentId: parentId === null || parentId === undefined ? null : parentId,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_PATCH]", error);
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; categoryId: string }> }
) {
  try {
    const { storeId, categoryId } = await params;
    const { userId } = await auth();

    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!storeByUserId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    const category = await prisma.category.delete({
      where: { id: categoryId },
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
