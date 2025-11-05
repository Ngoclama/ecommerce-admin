import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import slugify from "slugify";

export async function GET(
  req: Request,
  { params }: { params: { storeId: string; categoryId: string } }
) {
  try {
    if (!params.categoryId)
      return NextResponse.json(
        { message: "Category ID is required" },
        { status: 400 }
      );

    const category = await prisma.category.findUnique({
      where: { id: params.categoryId },
      include: { billboard: true },
    });

    if (!category)
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_GET]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; categoryId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name, billboardId } = body;

    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!name)
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    if (!billboardId)
      return NextResponse.json(
        { message: "Billboard ID is required" },
        { status: 400 }
      );

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });
    if (!storeByUserId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    const slug = slugify(name, { lower: true, strict: true });

    const updated = await prisma.category.update({
      where: { id: params.categoryId },
      data: { name, slug, billboardId },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CATEGORY_PATCH]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
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
