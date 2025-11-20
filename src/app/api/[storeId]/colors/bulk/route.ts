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

    // Lọc dữ liệu hợp lệ (cần cả name và value)
    const data = rows
      .filter((r: any) => r.name && r.value)
      .map((r: any) => ({
        name: r.name,
        value: r.value, // Ví dụ: "#FF0000"
        storeId: params.storeId,
      }));

    if (data.length === 0) {
      return new NextResponse("No valid colors to create", { status: 400 });
    }

    // Lưu hàng loạt vào DB
    await prisma.color.createMany({
      data,
    });

    return NextResponse.json({ success: true, count: data.length });
  } catch (error) {
    console.error("[COLORS_BULK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
