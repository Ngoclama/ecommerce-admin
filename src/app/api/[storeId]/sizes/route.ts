import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// 1. TẠO SIZE MỚI
export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { storeId } = await params; // [FIX] Await params

    const { userId } = await auth();
    const body = await req.json();
    const { name, value } = body;

    // Validation
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!value) return new NextResponse("Value is required", { status: 400 });
    if (!storeId)
      return new NextResponse("Store id is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const size = await prisma.size.create({
      data: { name, value, storeId: storeId },
    });

    return NextResponse.json(size);
  } catch (error) {
    console.error("[SIZES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// 2. LẤY DANH SÁCH SIZE
export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { storeId } = await params; // [FIX] Await params

    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const sizes = await prisma.size.findMany({
      where: { storeId: storeId },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sizes);
  } catch (error) {
    console.error("[SIZES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = await auth();
    const { storeId } = await params;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!storeId)
      return new NextResponse("Store id is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const productsToDelete = await prisma.product.findMany({
      where: { storeId: storeId },
      select: { id: true, name: true },
    });

    if (productsToDelete.length > 0) {
      const productIds = productsToDelete.map((p) => p.id);

      await prisma.image.deleteMany({
        where: { productId: { in: productIds } },
      });

      await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });

      console.warn(
        `[SIZES_DELETE_ALL] Automatically deleted ${productsToDelete.length} products due to size constraint.`
      );
    }

    const result = await prisma.size.deleteMany({
      where: {
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted all sizes. (${productsToDelete.length} dependent products were also removed.)`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("[SIZES_DELETE_ALL_ERROR]", error);

    if (error.code === "P2014") {
      return new NextResponse(
        "Failed to delete sizes due to underlying constraints. Check Orders/Reviews.",
        { status: 400 }
      );
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
