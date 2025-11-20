import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: { couponId: string } }
) {
  try {
    if (!params.couponId) {
      return new NextResponse("Coupon id is required", { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: {
        id: params.couponId,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.log("[COUPON_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ storeId: string; couponId: string }> }
) {
  try {
    const params = await props.params;
    const { userId } = await auth();
    const body = await req.json();
    const { code, value, type } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 403 });
    if (!code) return new NextResponse("Code is required", { status: 400 });
    if (!value) return new NextResponse("Value is required", { status: 400 });
    if (!type) return new NextResponse("Type is required", { status: 400 });

    if (!params.couponId) {
      return new NextResponse("Coupon id is required", { status: 400 });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 405 });

    const coupon = await prisma.coupon.update({
      where: {
        id: params.couponId,
      },
      data: {
        code,
        value,
        type,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.log("[COUPON_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ storeId: string; couponId: string }> }
) {
  try {
    const params = await props.params;
    const { userId } = await auth();

    if (!userId) return new NextResponse("Unauthenticated", { status: 403 });

    if (!params.couponId) {
      return new NextResponse("Coupon id is required", { status: 400 });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 405 });

    const coupon = await prisma.coupon.delete({
      where: {
        id: params.couponId,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.log("[COUPON_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
