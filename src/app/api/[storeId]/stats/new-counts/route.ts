import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { startOfMonth } from "date-fns";

// API route để lấy số lượng product và billboard mới trong tháng
export async function GET(
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

    const currentMonthStart = startOfMonth(new Date());

    const [newProductsCount, newBillboardsCount] = await Promise.all([
      prisma.product.count({
        where: {
          storeId: storeId,
          createdAt: {
            gte: currentMonthStart,
          },
        },
      }),
      prisma.billboard.count({
        where: {
          storeId: storeId,
          createdAt: {
            gte: currentMonthStart,
          },
        },
      }),
    ]);

    return NextResponse.json({
      newProductsCount,
      newBillboardsCount,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[NEW_COUNTS_GET]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
