import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const { materialId } = await params; 
    if (!materialId)
      return new NextResponse("Material id is required", { status: 400 });

    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    return NextResponse.json(material);
  } catch (error) {
    console.log("[MATERIAL_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; materialId: string }> }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();

    const { name, value } = body;
    const { storeId, materialId } = await params;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!name) return new NextResponse("Name is required", { status: 400 });
    if (!value) return new NextResponse("Value is required", { status: 400 });
    if (!materialId)
      return new NextResponse("Material id is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const material = await prisma.material.updateMany({
      where: { id: materialId },
      data: { name, value },
    });

    return NextResponse.json(material);
  } catch (err) {
    console.log("[MATERIAL_PATCH]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; materialId: string }> }
) {
  try {
    const { userId } = await auth();
    const { storeId, materialId } = await params;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!materialId)
      return new NextResponse("Material id is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const material = await prisma.material.deleteMany({
      where: { id: materialId },
    });

    return NextResponse.json(material);
  } catch (err) {
    console.log("[MATERIAL_DELETE]", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
