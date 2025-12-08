import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {
  API_MESSAGES,
  HTTP_STATUS,
  ORDER_STATUS,
  PAYMENT_METHODS,
} from "@/lib/constants";
import { devError } from "@/lib/api-utils";
import {
  validateOrderStatusTransition,
  handleOrderStatusTransition,
} from "@/lib/order-state-machine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return new NextResponse("Order ID is required", { status: 400 });
    }

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
        subtotal: true,
        tax: true,
        discount: true,
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
            productPrice: true,
            sizeName: true,
            colorName: true,
            materialName: true,
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

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_GET_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
  let orderId: string | undefined;
  let storeId: string | undefined;
  try {
    const paramsData = await params;
    storeId = paramsData.storeId;
    orderId = paramsData.orderId;
    const { userId } = await auth();
    const body = await req.json();

    const {
      status,
      shippingMethod,
      shippingCost,
      trackingNumber,
      paymentMethod,
      transactionId,
      customerNote,
      adminNote,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
    } = body;

    // Authentication & Authorization
    if (!userId)
      return new NextResponse("Vui lòng đăng nhập để tiếp tục", {
        status: 401,
      });

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!store)
      return new NextResponse("Bạn không có quyền thực hiện thao tác này", {
        status: 403,
      });

    // Fetch existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return new NextResponse("Không tìm thấy đơn hàng", { status: 404 });
    }

    console.log("[ORDER_PATCH] Update request:", {
      orderId,
      currentStatus: existingOrder.status,
      requestedStatus: status,
      statusChanged: status && status !== existingOrder.status,
    });

    // Validate status transition using state machine
    if (status && status !== existingOrder.status) {
      const validation = validateOrderStatusTransition(
        existingOrder.status,
        status
      );

      console.log("[ORDER_PATCH] Validation result:", validation);

      if (!validation.valid) {
        return NextResponse.json(
          {
            error: "Không thể chuyển trạng thái đơn hàng",
            message: validation.error,
            currentStatus: existingOrder.status,
            requestedStatus: status,
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    // Always include status - use provided status or keep existing
    const updateData: any = {
      status: status !== undefined ? status : existingOrder.status,
      shippingMethod:
        shippingMethod !== undefined
          ? shippingMethod
          : existingOrder.shippingMethod,
      shippingCost:
        shippingCost !== undefined
          ? Number(shippingCost)
          : existingOrder.shippingCost,
      trackingNumber:
        trackingNumber !== undefined
          ? trackingNumber
          : existingOrder.trackingNumber,
      paymentMethod:
        paymentMethod !== undefined
          ? paymentMethod
          : existingOrder.paymentMethod,
      transactionId:
        transactionId !== undefined
          ? transactionId
          : existingOrder.transactionId,
      customerNote:
        customerNote !== undefined ? customerNote : existingOrder.customerNote,
      adminNote: adminNote !== undefined ? adminNote : existingOrder.adminNote,
      email: email !== undefined ? email : existingOrder.email,
      phone: phone !== undefined ? phone : existingOrder.phone,
      address: address !== undefined ? address : existingOrder.address,
      city: city !== undefined ? city : existingOrder.city,
      postalCode:
        postalCode !== undefined ? postalCode : existingOrder.postalCode,
      country: country !== undefined ? country : existingOrder.country,
    };

    // Payment logic
    const isOnlinePayment =
      existingOrder.paymentMethod === PAYMENT_METHODS.STRIPE ||
      existingOrder.paymentMethod === PAYMENT_METHODS.MOMO;

    if (isOnlinePayment) {
      // Online payments are always paid
      updateData.isPaid = true;
    } else if (
      status === ORDER_STATUS.DELIVERED &&
      existingOrder.paymentMethod === PAYMENT_METHODS.COD &&
      !existingOrder.isPaid
    ) {
      // COD orders are marked paid on delivery
      updateData.isPaid = true;
    }

    // Handle status-specific business logic
    if (status && status !== existingOrder.status) {
      const transitionResult = await handleOrderStatusTransition(
        existingOrder.id,
        existingOrder.status,
        status,
        existingOrder
      );

      if (!transitionResult.success) {
        return NextResponse.json(
          {
            error: "Không thể cập nhật trạng thái đơn hàng",
            message: transitionResult.message,
          },
          { status: 400 }
        );
      }

      // Merge business logic results
      // Only merge valid Order model fields, exclude metadata like 'message'
      if (transitionResult.updates) {
        const { message, requiresRefund, ...validUpdates } = transitionResult.updates;
        Object.assign(updateData, validUpdates);
    }
    }

    console.log("[ORDER_PATCH] Final update data:", {
      orderId,
      updateData,
      statusInUpdate: updateData.status,
      updateDataKeys: Object.keys(updateData),
    });

    // Update order
    try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

      console.log("[ORDER_PATCH] Order updated successfully:", {
        orderId,
        newStatus: order.status,
      });

    return NextResponse.json(order);
    } catch (dbError: any) {
      console.error("[ORDER_PATCH_DB_ERROR]", {
        orderId,
        error: dbError,
        errorCode: dbError?.code,
        errorMessage: dbError?.message,
        updateData,
      });
      throw dbError;
    }
  } catch (error: any) {
    console.error("[ORDER_PATCH_ERROR]", {
      orderId: orderId || "unknown",
      error,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorCode: error?.code,
    });
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === "development"
      ? error?.message || "Đã xảy ra lỗi. Vui lòng thử lại sau"
      : "Đã xảy ra lỗi. Vui lòng thử lại sau";
    
    return NextResponse.json(
      {
        error: "Không thể cập nhật đơn hàng",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          details: error?.message,
          code: error?.code,
        }),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
  try {
    const { storeId, orderId } = await params;
    const { userId } = await auth();

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    // Kiểm tra đơn hàng có tồn tại không
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        orderNumber: true,
      },
    });

    if (!existingOrder) {
      return new NextResponse(
        JSON.stringify({ error: "Không tìm thấy đơn hàng" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Chỉ cho phép xóa đơn hàng đã hoàn thành (DELIVERED), đã hủy (CANCELLED) hoặc đã trả hàng (RETURNED)
    // Không cho xóa đơn đang xử lý (PENDING, PROCESSING, SHIPPED)
    const allowedStatusesToDelete = [
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.RETURNED,
    ];

    if (!(allowedStatusesToDelete as any).includes(existingOrder.status)) {
      return new NextResponse(
        JSON.stringify({
          error: "Không thể xóa đơn hàng",
          message: `Chỉ có thể xóa đơn hàng đã giao thành công, đã hủy hoặc đã trả hàng. Đơn hàng #${existingOrder.orderNumber} đang ở trạng thái: ${existingOrder.status}`,
          currentStatus: existingOrder.status,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Xóa các bản ghi liên quan trước (Return không có onDelete Cascade)
    // Xóa Return items trước
    await prisma.returnItem.deleteMany({
      where: {
        return: {
          orderId: orderId,
        },
      },
    });

    // Xóa Returns
    await prisma.return.deleteMany({
      where: { orderId: orderId },
    });

    // Shipping sẽ tự động xóa do onDelete: Cascade
    // OrderItems sẽ tự động xóa do onDelete: Cascade

    const order = await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa đơn hàng thành công",
      order,
    });
  } catch (error) {
    devError("[ORDER_DELETE_ERROR]", error);
    return new NextResponse(JSON.stringify({ error: "Lỗi khi xóa đơn hàng" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
