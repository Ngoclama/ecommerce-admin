import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ───────────────────────────────────────────────
// GET: Public API - Lấy billboard theo ID (không cần storeId)
// ───────────────────────────────────────────────
export async function GET(
  req: Request,
  { params }: { params: Promise<{ billboardId: string }> }
) {
  try {
    const { billboardId } = await params;

    if (!billboardId) {
      return NextResponse.json(
        { success: false, message: "Billboard ID is required" },
        { status: 400 }
      );
    }

    const billboard = await prisma.billboard.findUnique({
      where: {
        id: billboardId,
      },
      select: {
        id: true,
        label: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!billboard) {
      return NextResponse.json(
        { success: false, message: "Billboard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(billboard);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[BILLBOARD_PUBLIC_GET]", error);
    }
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

