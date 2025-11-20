import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const body = await req.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    const data = rows
      .filter((r) => r.name && r.billboardId)
      .map((r) => ({
        name: r.name,
        billboardId: r.billboardId,
        storeId: params.storeId,
      }));

    if (data.length === 0) {
      return new NextResponse("No valid categories", { status: 400 });
    }

    await prisma.category.createMany({
      data,
    });

    return NextResponse.json({ success: true, count: data.length });
  } catch (error) {
    console.error("[CATEGORIES_BULK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
