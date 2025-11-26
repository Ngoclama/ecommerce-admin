import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET: Lấy chi tiết flash sale
export async function GET(
  req: Request,
  { params }: { params: Promise<{ flashSaleId: string }> }
) {
  try {
    const { flashSaleId } = await params;

    if (!flashSaleId) {
      return new NextResponse("Flash Sale ID is required", { status: 400 });
    }

    const flashSale = await prisma.flashSale.findUnique({
      where: {
        id: flashSaleId,
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
    });

    if (!flashSale) {
      return new NextResponse("Flash Sale not found", { status: 404 });
    }

    return NextResponse.json(flashSale);
  } catch (error) {
    console.error("[FLASH_SALE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH: Cập nhật flash sale
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; flashSaleId: string }> }
) {
  try {
    const { storeId, flashSaleId } = await params;
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

    const flashSale = await prisma.flashSale.findUnique({
      where: { id: flashSaleId },
    });

    if (!flashSale || flashSale.storeId !== storeId) {
      return new NextResponse("Flash Sale not found", { status: 404 });
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return new NextResponse("End date must be after start date", {
          status: 400,
        });
      }
    }

    // Update flash sale
    const updatedFlashSale = await prisma.flashSale.update({
      where: { id: flashSaleId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        discountType: discountType || undefined,
        discountValue: discountValue ? Number(discountValue) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    // Update products if provided
    if (productIds && Array.isArray(productIds)) {
      // Delete existing products
      await prisma.flashSaleProduct.deleteMany({
        where: { flashSaleId: flashSaleId },
      });

      // Create new products
      if (productIds.length > 0) {
        await prisma.flashSaleProduct.createMany({
          data: productIds.map((productId: string) => ({
            flashSaleId: flashSaleId,
            productId,
          })),
        });
      }
    }

    const result = await prisma.flashSale.findUnique({
      where: { id: flashSaleId },
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
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[FLASH_SALE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE: Xóa flash sale
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; flashSaleId: string }> }
) {
  try {
    const { storeId, flashSaleId } = await params;
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

    const flashSale = await prisma.flashSale.findUnique({
      where: { id: flashSaleId },
    });

    if (!flashSale || flashSale.storeId !== storeId) {
      return new NextResponse("Flash Sale not found", { status: 404 });
    }

    await prisma.flashSale.delete({
      where: { id: flashSaleId },
    });

    return NextResponse.json({ message: "Flash Sale deleted successfully" });
  } catch (error) {
    console.error("[FLASH_SALE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

