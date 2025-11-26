import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    if (!reviewId)
      return new NextResponse("Review ID required", { status: 400 });

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    return NextResponse.json(review);
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; reviewId: string }> }
) {
  try {
    const { storeId, reviewId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const { isArchived, adminResponse } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isArchived: isArchived !== undefined ? isArchived : undefined,
        adminResponse: adminResponse !== undefined ? adminResponse : undefined,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.log("[REVIEW_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; reviewId: string }> }
) {
  try {
    const { storeId, reviewId } = await params;
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const review = await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.log("[REVIEW_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
