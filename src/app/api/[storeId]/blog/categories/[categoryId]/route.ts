import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    if (!categoryId) {
      return new NextResponse("Category ID is required", { status: 400 });
    }

    const category = await prisma.blogCategory.findUnique({
      where: {
        id: categoryId,
      },
      include: {
        blogPosts: {
          include: {
            blogPost: true,
          },
        },
      },
    });

    if (!category) {
      return new NextResponse("Blog category not found", { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("[BLOG_CATEGORY_GET]", error);
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

    const { name, description } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const category = await prisma.blogCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.storeId !== storeId) {
      return new NextResponse("Blog category not found", { status: 404 });
    }

    // Generate new slug if name changed
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = slugify(name, { lower: true, strict: true });
      const existingCategory = await prisma.blogCategory.findFirst({
        where: {
          storeId: storeId,
          slug: slug,
        },
      });
      if (existingCategory && existingCategory.id !== categoryId) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
      }
    }

    const updatedCategory = await prisma.blogCategory.update({
      where: { id: categoryId },
      data: {
        name: name || undefined,
        slug: slug || undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("[BLOG_CATEGORY_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; categoryId: string }> }
) {
  try {
    const { storeId, categoryId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const category = await prisma.blogCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.storeId !== storeId) {
      return new NextResponse("Blog category not found", { status: 404 });
    }

    await prisma.blogCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ message: "Blog category deleted successfully" });
  } catch (error) {
    console.error("[BLOG_CATEGORY_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
