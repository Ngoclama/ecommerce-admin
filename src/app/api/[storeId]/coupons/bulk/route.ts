import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const body = await req.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    const data = rows
      .filter((r: any) => r.code && r.value)
      .map((r: any) => ({
        storeId: params.storeId,
        code: r.code,
        value: parseFloat(r.value),
        type: r.type || "PERCENT", // PERCENT | FIXED
        expiresAt: r.expiresAt ? new Date(r.expiresAt) : null,
      }));

    if (data.length === 0) {
      return new NextResponse("No valid coupons data", { status: 400 });
    }

    await prisma.coupon.createMany({
      data,
    });

    return NextResponse.json({ success: true, count: data.length });
  } catch (error: any) {
    console.error("[COUPONS_BULK_POST]", error);

    if (error.code === "P2002") {
      return new NextResponse("Duplicate coupon codes found in database", {
        status: 409,
      });
    }

    return new NextResponse("Internal Error", { status: 500 });
  }
}
