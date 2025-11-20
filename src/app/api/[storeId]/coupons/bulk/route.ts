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

    // Lọc và chuẩn hóa dữ liệu
    const data = rows
      .filter((r: any) => r.code && r.value)
      .map((r: any) => ({
        code: r.code,
        value: parseFloat(r.value), // Chuyển thành số
        type: r.type || "PERCENT",  // Mặc định là % nếu thiếu
        storeId: params.storeId,
      }));

    if (data.length === 0) {
      return new NextResponse("No valid coupons", { status: 400 });
    }

    // Lưu vào DB
    await prisma.coupon.createMany({
      data,
    });

    return NextResponse.json({ success: true, count: data.length });
  } catch (error) {
    console.error("[COUPONS_BULK_POST]", error);
    return new NextResponse("Internal Error (Check for duplicate codes)", { status: 500 });
  }
}