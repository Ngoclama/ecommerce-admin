import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { code, value, type } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 403 });
    if (!code) return new NextResponse("Code is required", { status: 400 });
    if (!value) return new NextResponse("Value is required", { status: 400 });
    if (!type) return new NextResponse("Type is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 405 });

    const coupon = await prisma.coupon.create({
      data: {
        code,
        value,
        type,
        storeId: params.storeId,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.log("[COUPONS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    if (!params.storeId)
      return new NextResponse("Store id is required", { status: 400 });

    const coupons = await prisma.coupon.findMany({
      where: { storeId: params.storeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.log("[COUPONS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
