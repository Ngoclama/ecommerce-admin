import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET: Lấy danh sách flash sales
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

    const flashSales = await prisma.flashSale.findMany({
      where: {
        storeId: storeId,
      },
      include: {
        flashSaleProducts: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(flashSales);
  } catch (error) {
    console.error("[FLASH_SALES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST: Tạo flash sale mới
export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const {
      name,
      description,
      startDate,
      endDate,
      discountType,
      discountValue,
      productIds,
      isActive,
    } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    if (!name || !startDate || !endDate || !discountType || !discountValue) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return new NextResponse("End date must be after start date", {
        status: 400,
      });
    }

    // Create flash sale with products
    const flashSale = await prisma.flashSale.create({
      data: {
        storeId,
        name,
        description: description || null,
        startDate: start,
        endDate: end,
        discountType,
        discountValue: Number(discountValue),
        isActive: isActive !== undefined ? isActive : true,
        flashSaleProducts: {
          create: (productIds || []).map((productId: string) => ({
            productId,
          })),
        },
      },
      include: {
        flashSaleProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(flashSale, { status: 201 });
  } catch (error) {
    console.error("[FLASH_SALES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE: Xóa tất cả flash sales
export async function DELETE(
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

    let flashSaleIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific flash sales by IDs
      const flashSalesToDelete = await prisma.flashSale.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      flashSaleIds = flashSalesToDelete.map((f) => f.id);

      if (flashSaleIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid flash sales found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all flash sales (original behavior)
      const flashSalesToDelete = await prisma.flashSale.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      flashSaleIds = flashSalesToDelete.map((f) => f.id);
    }

    const result = await prisma.flashSale.deleteMany({
      where: {
        id: { in: flashSaleIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${result.count} flash sales.`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("[FLASH_SALES_DELETE_ALL_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
