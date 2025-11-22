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
