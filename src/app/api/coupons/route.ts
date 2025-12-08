import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Get all active coupons or validate coupon by code
// ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    // If code is provided, validate specific coupon
    if (code) {
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

      // Disable cache for production
      return NextResponse.json([coupon], {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }

    // If no code, return all active coupons
    const coupons = await prisma.coupon.findMany({
      where: {
        // Chỉ lấy coupon chưa hết hạn hoặc không có hạn
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Disable cache for production - always return fresh data
    return NextResponse.json(coupons, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[COUPONS_PUBLIC_GET] Error:", error);

    // Return empty array instead of error to prevent frontend crash
    return NextResponse.json([]);
  }
}
