import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ billboardId: string }> }
) {
  try {
    const { billboardId } = await params;
    if (!billboardId) {
      return NextResponse.json(
        { message: "Billboard ID is required" },
        { status: 400 }
      );
    }
    const billboard = await prisma.billboard.findUnique({
      where: {
        id: billboardId,
      },
      include: {
        categories: {
          select: { id: true, name: true },
        },
      },
    });

    if (!billboard) {
      return NextResponse.json(
        { message: "Billboard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(billboard);
  } catch (error) {
    console.error("[BILLBOARD_GET]", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; billboardId: string }> }
) {
  try {
    const { storeId, billboardId } = await params;
    const { userId } = await auth();
    const body = await req.json();
    const { label, imageUrl } = body;

    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!label)
      return NextResponse.json(
        { message: "Label is required" },
        { status: 400 }
      );
    if (!imageUrl)
      return NextResponse.json(
        { message: "Image URL is required" },
        { status: 400 }
      );
    if (!storeId)
      return NextResponse.json(
        { message: "Store ID is required" },
        { status: 400 }
      );

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!storeByUserId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    const billboard = await prisma.billboard.update({
      where: { id: billboardId },
      data: { label, imageUrl },
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.error("[BILLBOARD_PATCH]", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ billboardId: string; storeId: string }> }
) {
  try {
    const { billboardId, storeId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!storeId || !billboardId) {
      return NextResponse.json(
        { message: "Store ID and Billboard ID are required" },
        { status: 400 }
      );
    }

    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    });
    if (!storeByUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const usedByCategories = await prisma.category.count({
      where: {
        billboardId: billboardId,
      },
    });

    if (usedByCategories > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete billboard. It is currently linked to ${usedByCategories} categories.`,
          error: "CONSTRAINT_VIOLATION",
        },
        { status: 400 }
      );
    }

    const billboard = await prisma.billboard.delete({
      where: {
        id: billboardId,
      },
    });

    return NextResponse.json(billboard);
  } catch (error: any) {
    console.error("[BILLBOARD_DELETE]", error);

    if (error.code === "P2014") {
      return NextResponse.json(
        {
          message: "Deletion failed due to external data constraints.",
          error: "CONSTRAINT_VIOLATION",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
