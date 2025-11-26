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
    const { productId, rating, content, imageUrls } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!rating) return new NextResponse("Rating is required", { status: 400 });

    const hasPurchased = await prisma.order.findFirst({
      where: {
        userId: userId,
        isPaid: true,
        orderItems: {
          some: {
            productId: productId,
          },
        },
      },
    });

    if (!hasPurchased) {
      return new NextResponse("Bạn phải mua sản phẩm này trước khi đánh giá.", {
        status: 403,
      });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        content,
        imageUrls: imageUrls || [],
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.log("[REVIEW_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

    const products = await prisma.product.findMany({
      where: { storeId },
      select: { id: true },
    });

    const productIds = products.map((p) => p.id);

    const reviews = await prisma.review.findMany({
      where: {
        productId: { in: productIds },
      },
      include: {
        user: true,
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.log("[REVIEW_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
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

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
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

    let reviewIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific reviews by IDs
      // Verify reviews belong to products in this store
      const products = await prisma.product.findMany({
        where: { storeId },
        select: { id: true },
      });

      const productIds = products.map((p) => p.id);

      const reviewsToDelete = await prisma.review.findMany({
        where: {
          id: { in: idsToDelete },
          productId: { in: productIds },
        },
        select: { id: true },
      });

      reviewIds = reviewsToDelete.map((r) => r.id);

      if (reviewIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid reviews found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all reviews (original behavior)
      const products = await prisma.product.findMany({
        where: { storeId },
        select: { id: true },
      });

      const productIds = products.map((p) => p.id);

      const reviewsToDelete = await prisma.review.findMany({
        where: {
          productId: { in: productIds },
        },
        select: { id: true },
      });

      reviewIds = reviewsToDelete.map((r) => r.id);
    }

    const result = await prisma.review.deleteMany({
      where: {
        id: { in: reviewIds },
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${result.count} reviews.`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("[REVIEWS_DELETE_ALL_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
