import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();
    const { name, value } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }
    // Nếu không có value hoặc value rỗng, mặc định là màu đen
    const finalValue = value?.trim() || "#000000";

    // Validate hex color format
    const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!hexRegex.test(finalValue)) {
      return new NextResponse("Invalid hex color format", { status: 400 });
    }
    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    });
    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const color = await prisma.color.create({
      data: {
        name,
        value: finalValue,
        storeId: storeId,
      },
    });

    return NextResponse.json(color);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COLORS_POST]", error);
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
    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const colors = await prisma.color.findMany({
      where: {
        storeId: storeId,
      },
      include: {
        _count: {
          select: { productVariants: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(colors);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COLORS_GET]", error);
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

    let colorIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific colors by IDs
      const colorsToDelete = await prisma.color.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      colorIds = colorsToDelete.map((c) => c.id);

      if (colorIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid colors found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all colors (original behavior)
      const colorsToDelete = await prisma.color.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      colorIds = colorsToDelete.map((c) => c.id);
    }

    if (colorIds.length > 0) {
      // 1. Xóa CartItem có colorId
      await prisma.cartItem.deleteMany({
        where: { colorId: { in: colorIds } },
      });

      // 2. Xóa ProductVariant có colorId
      await prisma.productVariant.deleteMany({
        where: { colorId: { in: colorIds } },
      });
    }

    // 3. Xóa các colors đã chọn
    const result = await prisma.color.deleteMany({
      where: {
        id: { in: colorIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${result.count} colors.`,
      count: result.count,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COLORS_DELETE_ALL]", error);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
