import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string; couponId: string }> }
) {
  try {
    const { storeId, couponId } = await params;
    if (!couponId) {
      return new NextResponse("Coupon id is required", { status: 400 });
    }
    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        storeId: storeId, // Filter by storeId
      },
    });

    if (!coupon) {
      return new NextResponse("Coupon not found", { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COUPON_GET]", error);
    }
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
    const { code, value, type, expiresAt } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 403 });
    if (!code) return new NextResponse("Code is required", { status: 400 });
    
    // Nếu không có value hoặc value <= 0, mặc định là 1
    const finalValue = value && value > 0 ? Number(value) : 1;
    
    // Nếu không có type, mặc định là PERCENT
    const finalType = type || "PERCENT";

    if (!params.couponId) {
      return new NextResponse("Coupon id is required", { status: 400 });
    }

    // Validate ngày quá khứ
    if (expiresAt) {
      const selectedDate = new Date(expiresAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return NextResponse.json(
          {
            error:
              "Expiration date cannot be in the past. Please select a future date.",
          },
          { status: 400 }
        );
      }
    }

    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 405 });

    // Kiểm tra trùng tên (trừ coupon hiện tại)
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        storeId: params.storeId,
        code: code.trim().toUpperCase(),
        id: { not: params.couponId }, // Loại trừ coupon hiện tại
      },
    });

    if (existingCoupon) {
      return NextResponse.json(
        {
          error: `Coupon code "${code
            .trim()
            .toUpperCase()}" already exists. Please change the code name and try again.`,
        },
        { status: 409 }
      );
    }

    const coupon = await prisma.coupon.updateMany({
      where: {
        id: params.couponId,
        storeId: params.storeId, // Đảm bảo chỉ update coupon của store này
      },
      data: {
        code: code.trim().toUpperCase(),
        value: finalValue,
        type: finalType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COUPON_PATCH]", error);
    }
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

    const coupon = await prisma.coupon.deleteMany({
      where: {
        id: params.couponId,
        storeId: params.storeId, // Đảm bảo chỉ delete coupon của store này
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COUPON_DELETE]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
