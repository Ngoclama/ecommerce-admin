import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string; colorId: string }> }
) {
  try {
    const { storeId, colorId } = await params;
    if (!colorId) {
      return new NextResponse("Color id is required", { status: 400 });
    }
    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    // Kiểm tra color thuộc về store này
    const color = await prisma.color.findFirst({
      where: {
        id: colorId,
        storeId: storeId,
      },
    });

    if (!color) {
      return new NextResponse("Color not found", { status: 404 });
    }

    return NextResponse.json(color);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[COLOR_GET]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; colorId: string }> }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();

    const { name, value } = body;
    const { storeId, colorId } = await params;

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

    if (!colorId) {
      return new NextResponse("Color id is required", { status: 400 });
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

    const color = await prisma.color.updateMany({
      where: {
        id: colorId,
        storeId: storeId, // Đảm bảo chỉ update color của store này
      },
      data: {
        name,
        value: finalValue,
      },
    });

    return NextResponse.json(color);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COLOR_PATCH]", err);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

//// Delete Method

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; colorId: string }> }
) {
  try {
    const { userId } = await auth();
    const { storeId, colorId } = await params;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!colorId) {
      return new NextResponse("Color id is required", { status: 400 });
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

    // 1. Xóa CartItem có colorId này
    await prisma.cartItem.deleteMany({
      where: { colorId: colorId },
    });

    // 2. Xóa ProductVariant có colorId này
    await prisma.productVariant.deleteMany({
      where: { colorId: colorId },
    });

    // 3. Xóa color
    const color = await prisma.color.delete({
      where: {
        id: colorId,
      },
    });

    return NextResponse.json(color);
  } catch (err) {
    console.log("[COLOR_DELETE]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
