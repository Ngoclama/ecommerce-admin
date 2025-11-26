import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    if (!storeId)
      return new NextResponse("Store ID is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const body = await req.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    const data = rows
      .filter((r: any) => r.name && r.value)
      .map((r: any) => ({
        storeId: storeId,
        name: r.name,
        value: r.value,
      }));

    if (data.length === 0) {
      return new NextResponse("No valid data", { status: 400 });
    }

    await prisma.color.createMany({
      data,
    });

    return NextResponse.json({ success: true, count: data.length });
  } catch (error) {
    console.error("[COLORS_BULK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
