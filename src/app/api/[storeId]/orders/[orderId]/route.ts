import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET: Lấy chi tiết đơn hàng
export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    if (!params.orderId) {
      return new NextResponse("Order ID is required", { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: params.orderId,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.log("[ORDER_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH: Cập nhật trạng thái + Tự động hoàn kho
export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; orderId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { status } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!status) return new NextResponse("Status is required", { status: 400 });

    // 1. Kiểm tra quyền sở hữu Store
    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    // 2. Lấy thông tin đơn hàng hiện tại (để biết status cũ và danh sách sản phẩm)
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: { orderItems: true },
    });

    if (!existingOrder)
      return new NextResponse("Order not found", { status: 404 });

    // 3. LOGIC HOÀN KHO: Nếu chuyển sang CANCELLED mà đơn cũ chưa hủy
    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
      // Dùng Transaction để đảm bảo: Cập nhật trạng thái VÀ Cộng kho cùng lúc
      await prisma.$transaction([
        // a. Cập nhật trạng thái đơn hàng
        prisma.order.update({
          where: { id: params.orderId },
          data: { status: "CANCELLED" },
        }),
        // b. Cộng lại số lượng tồn kho cho từng sản phẩm
        ...existingOrder.orderItems.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              inventory: {
                increment: item.quantity, // Cộng thêm số lượng khách đã mua trả về kho
              },
            },
          })
        ),
      ]);

      return NextResponse.json({ message: "Order cancelled & Stock restored" });
    }

    // LOGIC NGƯỢC LẠI (Tùy chọn): Nếu lỡ tay hủy nhầm, muốn khôi phục lại (Un-cancel)
    // Thì phải trừ kho đi.
    if (existingOrder.status === "CANCELLED" && status !== "CANCELLED") {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: params.orderId },
          data: { status: status },
        }),
        ...existingOrder.orderItems.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              inventory: {
                decrement: item.quantity, // Trừ kho lại
              },
            },
          })
        ),
      ]);
      return NextResponse.json({ message: "Order restored & Stock deducted" });
    }

    //  Trường hợp cập nhật bình thường
    const order = await prisma.order.update({
      where: { id: params.orderId },
      data: { status },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.log("[ORDER_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE: Xóa đơn hàng
export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string; orderId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const order = await prisma.order.delete({
      where: { id: params.orderId },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.log("[ORDER_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
