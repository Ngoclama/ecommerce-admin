import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; sizeId: string }> }
) {
  try {
    const { userId } = await auth();
    const { storeId, sizeId } = await params;
    const body = await req.json();
    const { name, value } = body;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!value) return new NextResponse("Value is required", { status: 400 });
    if (!sizeId)
      return new NextResponse("Size ID is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const size = await prisma.size.updateMany({
      where: { 
        id: sizeId,
        storeId: storeId, // Đảm bảo chỉ update size của store này
      },
      data: { name, value },
    });

    return NextResponse.json(size);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[SIZE_PATCH]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string; sizeId: string }> }
) {
  try {
    const { storeId, sizeId } = await params;
    if (!sizeId) {
      return new NextResponse("Size id is required", { status: 400 });
    }
    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    // Kiểm tra size thuộc về store này
    const size = await prisma.size.findFirst({
      where: {
        id: sizeId,
        storeId: storeId,
      },
    });

    if (!size) {
      return new NextResponse("Size not found", { status: 404 });
    }

    return NextResponse.json(size);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[SIZE_GET]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ sizeId: string; storeId: string }> }
) {
  try {
    const { userId } = await auth();
    const { sizeId, storeId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!sizeId) {
      return new NextResponse("Size ID is required", { status: 400 });
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

    // 1. Xóa CartItem có sizeId này
    await prisma.cartItem.deleteMany({
      where: { sizeId: sizeId },
    });

    // 2. Xóa ProductVariant có sizeId này
    await prisma.productVariant.deleteMany({
      where: { sizeId: sizeId },
    });

    // 3. Xóa size
    const size = await prisma.size.delete({
      where: {
        id: sizeId,
      },
    });

    return NextResponse.json(size);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[SIZE_DELETE]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
