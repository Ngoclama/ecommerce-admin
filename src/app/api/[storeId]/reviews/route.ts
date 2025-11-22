import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        product: {
          storeId: params.storeId,
        },
      },
      include: {
        product: true, 
        user: true,    
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.log("[REVIEWS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}