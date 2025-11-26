import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const { code, value, type, expiresAt } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 403 });
    if (!code) return new NextResponse("Code is required", { status: 400 });
    
    // Nếu không có value hoặc value <= 0, mặc định là 1
    const finalValue = value && value > 0 ? Number(value) : 1;
    
    // Nếu không có type, mặc định là PERCENT
    const finalType = type || "PERCENT";

    if (!storeId)
      return new NextResponse("Store id is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 405 });

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

    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        storeId: storeId,
        code: code.trim().toUpperCase(),
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

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        value: finalValue,
        type: finalType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        storeId: storeId,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COUPONS_POST]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    if (!storeId)
      return new NextResponse("Store id is required", { status: 400 });

    const coupons = await prisma.coupon.findMany({
      where: { storeId: storeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COUPONS_GET]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();

    if (!userId) return new NextResponse("Unauthenticated", { status: 403 });

    if (!storeId)
      return new NextResponse("Store id is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 405 });

    // Check if request body has specific IDs to delete
    let body: any = {};
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 0) {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const idsToDelete = body.ids;

    let couponIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific coupons by IDs
      const couponsToDelete = await prisma.coupon.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      couponIds = couponsToDelete.map((c) => c.id);

      if (couponIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid coupons found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all coupons (original behavior)
      const couponsToDelete = await prisma.coupon.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      couponIds = couponsToDelete.map((c) => c.id);
    }

    const result = await prisma.coupon.deleteMany({
      where: {
        id: { in: couponIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: "All coupons deleted",
      count: result.count,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COUPONS_DELETE_ALL]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
