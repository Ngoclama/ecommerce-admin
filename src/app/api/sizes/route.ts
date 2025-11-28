import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Lấy tất cả sizes (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const sizes = await prisma.size.findMany({
      select: {
        id: true,
        name: true,
        value: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(sizes);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[SIZES_PUBLIC_GET]", error);
    }
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

