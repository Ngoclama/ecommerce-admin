import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const { name, value } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!value) return new NextResponse("Value is required", { status: 400 });
    if (!storeId)
      return new NextResponse("Store Id is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const material = await prisma.material.create({
      data: {
        name,
        value,
        storeId,
      },
    });

    return NextResponse.json(material);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[MATERIALS_POST]", err);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

    if (!storeId)
      return new NextResponse("Store Id is required", { status: 400 });

    const materials = await prisma.material.findMany({
      where: { storeId },
      include: {
        _count: {
          select: { productVariants: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(materials);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[MATERIALS_GET]", err);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!storeId)
      return new NextResponse("Store Id is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    // Check if request body has specific IDs to delete
    let body: any = {};
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 0) {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const idsToDelete = body.ids;

    let materialIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific materials by IDs
      const materialsToDelete = await prisma.material.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      materialIds = materialsToDelete.map((m) => m.id);

      if (materialIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid materials found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all materials (original behavior)
      const materialsToDelete = await prisma.material.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      materialIds = materialsToDelete.map((m) => m.id);
    }

    if (materialIds.length > 0) {
      // 1. Xóa CartItem có materialId
      await prisma.cartItem.deleteMany({
        where: { materialId: { in: materialIds } },
      });

      // 2. Xóa ProductVariant có materialId
      await prisma.productVariant.deleteMany({
        where: { materialId: { in: materialIds } },
      });
    }

    // 3. Xóa các materials đã chọn
    const result = await prisma.material.deleteMany({
      where: {
        id: { in: materialIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: "Deleted all materials",
      count: result.count,
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[MATERIALS_DELETE_ALL]", err);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
