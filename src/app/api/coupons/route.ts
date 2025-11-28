import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Validate coupon by code (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Tìm coupon theo code (không phân biệt store)
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        // Kiểm tra hết hạn
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      select: {
        id: true,
        code: true,
        value: true,
        type: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Coupon not found or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json([coupon]);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COUPONS_PUBLIC_GET]", error);
    }
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
