import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; colorId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name, value } = body;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!value) return new NextResponse("Value is required", { status: 400 });
    if (!params.colorId) return new NextResponse("Color ID is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 });

    const color = await prisma.color.update({
      where: { id: params.colorId },
      data: { name, value },
    });

    return NextResponse.json(color);
  } catch (error) {
    console.error("[COLOR_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { colorId: string } }
) {
  try {
    if (!params.colorId) {
      return new NextResponse("Color ID is required", { status: 400 });
    }
    const color = await prisma.color.findUnique({
      where: {
        id: params.colorId,
      },
    });

    return NextResponse.json(color);
  } catch (error) {
    console.error("[COLOR_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { colorId: string; storeId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.colorId) {
      return new NextResponse("Color ID is required", { status: 400 });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });
    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const color = await prisma.color.delete({
      where: {
        id: params.colorId,
      },
    });

    return NextResponse.json(color);
  } catch (error) {
    console.error("[COLOR_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}