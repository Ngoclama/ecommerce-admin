import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = await auth();
  const body = await req.json();

    const { name, value } = body;
    const { storeId } = await params;

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
    console.log(`[MATERIALS_POST] ${err}`);
    return new NextResponse(`Internal error`, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { storeId } = await params;

    if (!storeId)
      return new NextResponse("Store Id is required", { status: 400 });

    const materials = await prisma.material.findMany({
      where: { storeId },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(materials);
  } catch (err) {
    console.log(`[MATERIALS_GET] ${err}`);
    return new NextResponse(`Internal error`, { status: 500 });
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
      return new NextResponse("Store Id is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const result = await prisma.material.deleteMany({
      where: {
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: "Deleted all materials",
      count: result.count,
    });
  } catch (err) {
    console.log(`[MATERIALS_DELETE_ALL] ${err}`);
    return new NextResponse(`Internal error`, { status: 500 });
  }
}
