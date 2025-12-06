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
    console.log(
      "[BILLBOARDS_PUBLIC_GET] Found",
      billboards.length,
      "billboards"
    );
    if (billboards.length > 0) {
      console.log("[BILLBOARDS_PUBLIC_GET] First billboard:", {
        id: billboards[0].id,
        label: billboards[0].label,
        hasImage: !!billboards[0].imageUrl,
      });
    }

    // Always return array, even if empty
    const response = NextResponse.json(billboards || []);

    // Add CORS headers to allow store frontend to access
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  } catch (error: any) {
    console.error("[BILLBOARDS_PUBLIC_GET] Error:", error);
    console.error("[BILLBOARDS_PUBLIC_GET] Error message:", error?.message);
    console.error("[BILLBOARDS_PUBLIC_GET] Error stack:", error?.stack);

    // Return empty array instead of error to prevent frontend crash
    // Frontend will handle empty array gracefully
    const response = NextResponse.json([], { status: 200 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
