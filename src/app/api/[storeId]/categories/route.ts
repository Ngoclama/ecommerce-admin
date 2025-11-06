import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import slugify from "slugify";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name, billboardId } = body;

    if (!userId)
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
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
    if (!params.storeId)
      return NextResponse.json(
        { message: "Store ID is required" },
        { status: 400 }
      );

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });

    if (!storeByUserId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    const slug = slugify(name, { lower: true, strict: true });

    const category = await prisma.category.create({
      data: {
        name,
        billboardId,
        storeId: params.storeId,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_POST]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    if (!params.storeId)
      return NextResponse.json(
        { message: "Store ID is required" },
        { status: 400 }
      );

    const categories = await prisma.category.findMany({
      where: { storeId: params.storeId },
      include: { billboard: true },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[CATEGORY_GET]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}

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

    await prisma.category.deleteMany({
      where: { storeId: params.storeId },
    });

    return NextResponse.json({ message: "All categories deleted" });
  } catch (error) {
    console.error("[CATEGORY_DELETE_ALL]", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 }
    );
  }
}