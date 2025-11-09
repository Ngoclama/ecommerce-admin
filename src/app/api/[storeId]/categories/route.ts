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
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 }
      );
    if (!name)
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    if (!billboardId)
      return NextResponse.json(
        { success: false, message: "Billboard ID is required" },
        { status: 400 }
      );
    if (!params.storeId)
      return NextResponse.json(
        { success: false, message: "Store ID is required" },
        { status: 400 }
      );

    const store = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });
    if (!store)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );

    const slug = slugify(name, { lower: true, strict: true });

    const category = await prisma.category.create({
      data: { name, billboardId, storeId: params.storeId },
    });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CATEGORY_POST]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
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
        { success: false, message: "Store ID is required" },
        { status: 400 }
      );

    const categories = await prisma.category.findMany({
      where: { storeId: params.storeId },
      include: { billboard: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("[CATEGORY_GET]", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  console.log("[API] DELETE ALL CATEGORIES for storeId:", params.storeId);

  try {
    const { userId } = await auth();
    console.log("[API] userId:", userId);

    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 }
      );

    const store = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });
    console.log("[API] Store found:", !!store);

    if (!store)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );

    console.log("[API] Deleting all products...");
    await prisma.product.deleteMany({
      where: { storeId: params.storeId },
    });

    console.log("[API] Deleting all categories...");
    const deleted = await prisma.category.deleteMany({
      where: { storeId: params.storeId },
    });

    console.log("[API] Deleted categories count:", deleted.count);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} categories successfully.`,
      count: deleted.count,
    });
  } catch (error: any) {
    console.error("[CATEGORY_DELETE_ALL_ERROR]", error);

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete categories because they are linked to existing products.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
