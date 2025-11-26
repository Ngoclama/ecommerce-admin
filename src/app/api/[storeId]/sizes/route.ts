import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// 1. TẠO SIZE MỚI
export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

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
    if (process.env.NODE_ENV === "development") {
      console.error("[SIZES_POST]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

// 2. LẤY DANH SÁCH SIZE
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params; // [FIX] Await params

    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const sizes = await prisma.size.findMany({
      where: { storeId: storeId },
      include: {
        _count: { select: { productVariants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sizes);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[SIZES_GET]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
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

    let sizeIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific sizes by IDs
      const sizesToDelete = await prisma.size.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      sizeIds = sizesToDelete.map((s) => s.id);

      if (sizeIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid sizes found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all sizes (original behavior)
      const sizesToDelete = await prisma.size.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      sizeIds = sizesToDelete.map((s) => s.id);
    }

    if (sizeIds.length > 0) {
      // 1. Xóa CartItem có sizeId
      await prisma.cartItem.deleteMany({
        where: { sizeId: { in: sizeIds } },
      });

      // 2. Xóa ProductVariant có sizeId
      await prisma.productVariant.deleteMany({
        where: { sizeId: { in: sizeIds } },
      });
    }

    // 3. Xóa các sizes đã chọn
    const result = await prisma.size.deleteMany({
      where: {
        id: { in: sizeIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted all sizes.`,
      count: result.count,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[SIZES_DELETE_ALL_ERROR]", error);
    }

    if (error.code === "P2014") {
      return new NextResponse(
        "Failed to delete sizes due to underlying constraints. Check Orders/Reviews.",
        { status: 400 }
      );
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
