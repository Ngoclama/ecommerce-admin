import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET: Lấy danh sách returns
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

    // Kiểm tra quyền sở hữu store
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const returns = await prisma.return.findMany({
      where: {
        order: {
          storeId: storeId,
        },
      },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        },
        user: true,
        returnItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error("[RETURNS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST: Tạo return request mới
export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const { orderId, reason, description, returnItems } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!orderId || !reason || !returnItems || !Array.isArray(returnItems)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Xác minh đơn hàng thuộc về user và store
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        storeId: storeId,
        userId: userId,
      },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Tạo return request kèm các sản phẩm trả lại
    const returnRequest = await prisma.return.create({
      data: {
        orderId: orderId,
        userId: userId,
        reason: reason,
        description: description || null,
        status: "PENDING",
        returnItems: {
          create: returnItems.map((item: any) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            reason: item.reason || reason,
          })),
        },
      },
      include: {
        returnItems: true,
        order: true,
        user: true,
      },
    });

    return NextResponse.json(returnRequest, { status: 201 });
  } catch (error) {
    console.error("[RETURNS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE: Xóa tất cả returns (admin only)
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

    // Kiểm tra request body có chứa IDs cụ thể cần xóa không
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

    let returnIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Xóa các returns theo IDs cụ thể
      const returnsToDelete = await prisma.return.findMany({
        where: {
          id: { in: idsToDelete },
          order: {
            storeId: storeId,
          },
        },
        select: { id: true },
      });

      returnIds = returnsToDelete.map((r) => r.id);

      if (returnIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid returns found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Xóa tất cả returns của store
      const orders = await prisma.order.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      const orderIds = orders.map((o) => o.id);

      if (orderIds.length === 0) {
        return NextResponse.json({
          message: "No returns to delete.",
          count: 0,
        });
      }

      // Lấy tất cả return IDs của các đơn hàng này
      const returnsToDelete = await prisma.return.findMany({
        where: {
          orderId: { in: orderIds },
        },
        select: { id: true },
      });

      returnIds = returnsToDelete.map((r) => r.id);
    }

    if (returnIds.length > 0) {
      // Xóa tất cả returns theo các IDs này
      const result = await prisma.return.deleteMany({
        where: {
          id: { in: returnIds },
        },
      });

      return NextResponse.json({
        message: `Successfully deleted ${result.count} returns.`,
        count: result.count,
      });
    }

    return NextResponse.json({
      message: "No returns to delete.",
      count: 0,
    });
  } catch (error: any) {
    console.error("[RETURNS_DELETE_ALL_ERROR]", error);

    if (error.code === "P2003") {
      return new NextResponse(
        "Failed to delete returns due to foreign key constraints.",
        { status: 400 }
      );
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
