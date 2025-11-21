import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId } = await auth();
    const { storeId } = await params; 
    const body = await req.json();
    const { rows } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!rows || !Array.isArray(rows)) {
      return new NextResponse("Invalid data", { status: 400 });
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

    const data = rows
      .filter((r: any) => r.name && r.value)
      .map((r: any) => ({
        name: r.name,
        value: r.value,
        storeId: storeId,
      }));

    if (data.length === 0) {
      return new NextResponse("No valid materials to create", { status: 400 });
    }

    await prisma.material.createMany({
      data,
    });

    return NextResponse.json({ success: true, count: data.length });
  } catch (error) {
    console.error("[MATERIALS_BULK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
