import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { startOfMonth } from "date-fns";

// API route để lấy danh sách product và billboard mới trong tháng
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

    const [newProducts, newBillboards] = await Promise.all([
      prisma.product.findMany({
        where: {
          storeId: storeId,
          createdAt: {
            gte: currentMonthStart,
          },
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10, // Lấy 10 sản phẩm mới nhất
      }),
      prisma.billboard.findMany({
        where: {
          storeId: storeId,
          createdAt: {
            gte: currentMonthStart,
          },
        },
        select: {
          id: true,
          label: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10, // Lấy 10 billboard mới nhất
      }),
    ]);

    return NextResponse.json({
      newProducts,
      newBillboards,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[NEW_ITEMS_GET]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

