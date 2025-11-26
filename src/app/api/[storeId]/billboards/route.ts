import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();
    const { label, imageUrl } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!label) {
      return new NextResponse("Label is required", { status: 400 });
    }
    if (!imageUrl) {
      return new NextResponse("Image URL is required", { status: 400 });
    }
    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const billboard = await prisma.billboard.create({
      data: {
        label,
        imageUrl,
        storeId: storeId,
      },
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.error("[Billboar_Post]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }
    const billboards = await prisma.billboard.findMany({
      where: {
        storeId: storeId,
      },
    });

    return NextResponse.json(billboards);
  } catch (error) {
    console.error("[Billboard_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Check if request body has specific IDs to delete
    let body: any = {};
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 0) {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const idsToDelete = body.ids;

    let allBillboards;
    let safeToDeleteIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific billboards by IDs
      allBillboards = await prisma.billboard.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        include: {
          _count: {
            select: { categories: true },
          },
        },
      });

      safeToDeleteIds = allBillboards
        .filter((bb) => bb._count.categories === 0)
        .map((bb) => bb.id);
    } else {
      // Delete all billboards (original behavior)
      allBillboards = await prisma.billboard.findMany({
        where: { storeId: storeId },
        include: {
          _count: {
            select: { categories: true },
          },
        },
      });

      safeToDeleteIds = allBillboards
        .filter((bb) => bb._count.categories === 0)
        .map((bb) => bb.id);
    }

    const skippedCount = allBillboards.length - safeToDeleteIds.length;

    let deletedCount = 0;

    if (safeToDeleteIds.length > 0) {
      const result = await prisma.billboard.deleteMany({
        where: {
          id: { in: safeToDeleteIds },
          storeId: storeId,
        },
      });
      deletedCount = result.count;
    }

    return NextResponse.json({
      message: `${deletedCount} billboards deleted. ${skippedCount} billboards were skipped because they still have linked categories.`,
      deletedCount: deletedCount,
      skippedCount: skippedCount,
    });
  } catch (error) {
    console.error("[Billboard_DELETE_ALL]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
