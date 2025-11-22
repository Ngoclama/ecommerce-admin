import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
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
    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const billboard = await prisma.billboard.create({
      data: {
        label,
        imageUrl,
        storeId: params.storeId,
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
  { params }: { params: { storeId: string } }
) {
  try {
    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }
    const billboards = await prisma.billboard.findMany({
      where: {
        storeId: params.storeId,
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
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const allBillboards = await prisma.billboard.findMany({
      where: { storeId: params.storeId },
      include: {
        _count: {
          select: { categories: true },
        },
      },
    });

    const safeToDeleteIds = allBillboards
      .filter((bb) => bb._count.categories === 0)
      .map((bb) => bb.id);

    const skippedCount = allBillboards.length - safeToDeleteIds.length;

    let deletedCount = 0;

    if (safeToDeleteIds.length > 0) {
      const result = await prisma.billboard.deleteMany({
        where: {
          id: { in: safeToDeleteIds },
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
