import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";

// GET: Lấy danh sách blog categories
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
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

    const categories = await prisma.blogCategory.findMany({
      where: {
        storeId: storeId,
      },
      include: {
        blogPosts: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[BLOG_CATEGORIES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST: Tạo blog category mới
export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
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

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Generate slug
    let slug = slugify(name, { lower: true, strict: true });
    const existingCategory = await prisma.blogCategory.findFirst({
      where: {
        storeId: storeId,
        slug: slug,
      },
    });

    if (existingCategory) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    const category = await prisma.blogCategory.create({
      data: {
        storeId,
        name,
        slug,
        description: description || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("[BLOG_CATEGORIES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
