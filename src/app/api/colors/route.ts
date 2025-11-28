import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Lấy tất cả colors (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const colors = await prisma.color.findMany({
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

    return NextResponse.json(colors);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COLORS_PUBLIC_GET]", error);
    }
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

