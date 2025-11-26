// API route để quản lý một đơn hàng cụ thể
// GET: Lấy thông tin chi tiết của đơn hàng
// PATCH: Cập nhật thông tin đơn hàng
// DELETE: Xóa đơn hàng

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * GET: Lấy thông tin chi tiết của một đơn hàng
 * Trả về kèm danh sách sản phẩm trong đơn
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Kiểm tra orderId có được truyền vào không
    if (!orderId) {
      return new NextResponse("Order ID is required", { status: 400 });
    }

    // Tối ưu: chỉ select các field cần thiết
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        phone: true,
        address: true,
        email: true,
        total: true,
        isPaid: true,
        status: true,
        shippingMethod: true,
        shippingCost: true,
        trackingNumber: true,
        paymentMethod: true,
        transactionId: true,
        customerNote: true,
        adminNote: true,
        city: true,
        postalCode: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        orderItems: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
                images: {
                  select: {
                    url: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // Kiểm tra đơn hàng có tồn tại không
    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[ORDER_GET]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

/**
 * PATCH: Cập nhật thông tin đơn hàng
 * Có thể cập nhật status, shipping info, payment info, notes, etc.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
  try {
    const { storeId, orderId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    // Lấy các trường cần cập nhật từ request body
    const {
      status, // Trạng thái đơn hàng (PENDING, PROCESSING, SHIPPED, etc.)
      shippingMethod, // Phương thức giao hàng
      shippingCost, // Phí vận chuyển
      trackingNumber, // Mã vận đơn
      paymentMethod, // Phương thức thanh toán
      transactionId, // ID giao dịch từ payment gateway
      customerNote, // Ghi chú từ khách hàng
      adminNote, // Ghi chú nội bộ
      email, // Email khách hàng
      city, // Thành phố
      postalCode, // Mã bưu điện
      country, // Quốc gia
    } = body;

    // Kiểm tra authentication
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    // Kiểm tra store có thuộc về user không
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!store) return new NextResponse("Unauthorized", { status: 403 });

    // Cập nhật đơn hàng
    // Các trường null sẽ không được cập nhật (giữ nguyên giá trị cũ)
    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
        shippingMethod: shippingMethod || null,
        shippingCost: shippingCost ? Number(shippingCost) : null, // Convert sang number
        trackingNumber: trackingNumber || null,
        paymentMethod: paymentMethod || null,
        transactionId: transactionId || null,
        customerNote: customerNote || null,
        adminNote: adminNote || null,
        email: email || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || null,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[ORDER_PATCH]", error);
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * DELETE: Xóa đơn hàng
 * OrderItem sẽ tự động xóa theo cascade delete
 * Nhưng cần xóa Return trước nếu có
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
  try {
    const { storeId, orderId } = await params;
    const { userId } = await auth();

    // Kiểm tra authentication
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    // Kiểm tra store có thuộc về user không
    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    // Xóa đơn hàng
    // OrderItem sẽ tự động xóa vì có onDelete: Cascade trong schema
    const order = await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json(order);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("[ORDER_DELETE]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
