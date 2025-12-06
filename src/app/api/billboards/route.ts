import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Lấy tất cả billboards (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    // Lấy tất cả billboards từ tất cả stores (public)
    const billboards = await prisma.billboard.findMany({
      select: {
        id: true,
        label: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Log for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[BILLBOARDS_PUBLIC_GET] Found", billboards.length, "billboards");
    }

    // Always return array, even if empty
    return NextResponse.json(billboards || []);
  } catch (error: any) {
    console.error("[BILLBOARDS_PUBLIC_GET] Error:", error);
    console.error("[BILLBOARDS_PUBLIC_GET] Error message:", error?.message);
    console.error("[BILLBOARDS_PUBLIC_GET] Error stack:", error?.stack);
    
    // Return empty array instead of error to prevent frontend crash
    // Frontend will handle empty array gracefully
    return NextResponse.json([], { status: 200 });
  }
}
