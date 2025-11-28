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

    return NextResponse.json(billboards);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[BILLBOARDS_PUBLIC_GET]", error);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
