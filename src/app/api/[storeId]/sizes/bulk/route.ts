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

    // Lọc dữ liệu hợp lệ
    const data = rows
      .filter((r: any) => r.name && r.value)
      .map((r: any) => ({
        name: r.name,
        value: r.value,
        storeId: params.storeId,
      }));

    if (data.length === 0)
      return new NextResponse("No valid sizes", { status: 400 });

    await prisma.size.createMany({ data });

    return NextResponse.json({ success: true, count: data.length });
  } catch (error) {
    console.error("[SIZES_BULK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
