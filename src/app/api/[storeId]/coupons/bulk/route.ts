import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    const { storeId } = await params;
    if (!storeId)
      return new NextResponse("Store ID is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: storeId,
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

    // Kiểm tra duplicate codes trong rows
    const codes = rows
      .map((r: any) => r.code?.trim().toUpperCase())
      .filter(Boolean);
    const duplicateCodes = codes.filter(
      (code, index) => codes.indexOf(code) !== index
    );
    if (duplicateCodes.length > 0) {
      const uniqueDuplicates = [...new Set(duplicateCodes)];
      return NextResponse.json(
        {
          error: `Duplicate codes found in your request: ${uniqueDuplicates.join(
            ", "
          )}. Please use different code names.`,
          duplicateCodes: uniqueDuplicates,
        },
        { status: 409 }
      );
    }

    // Kiểm tra codes đã tồn tại trong database
    const existingCodes = await prisma.coupon.findMany({
      where: {
        storeId: storeId,
        code: { in: codes },
      },
      select: { code: true },
    });

    if (existingCodes.length > 0) {
      const existingCodeList = existingCodes.map((c) => c.code).join(", ");
      return NextResponse.json(
        {
          error: `Coupon codes already exist in database: ${existingCodeList}. Please change these code names and try again.`,
          existingCodes: existingCodes.map((c) => c.code),
        },
        { status: 409 }
      );
    }

    // Validate và format data
    const data = rows
      .filter((r: any) => r.code && r.value)
      .map((r: any) => {
        const expiresAt = r.expiresAt ? new Date(r.expiresAt) : null;
        // Kiểm tra ngày quá khứ
        if (expiresAt) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (expiresAt < today) {
            throw new Error(
              `Expiration date cannot be in the past for code: ${r.code}`
            );
          }
        }
        return {
          storeId: storeId,
          code: r.code.trim().toUpperCase(),
          value: parseFloat(r.value),
          type: r.type || "PERCENT", // PERCENT | FIXED
          expiresAt: expiresAt,
        };
      });

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
      return NextResponse.json(
        {
          error:
            "Duplicate coupon codes found in database. Please change the code names and try again.",
        },
        { status: 409 }
      );
    }

    return new NextResponse("Internal Error", { status: 500 });
  }
}
