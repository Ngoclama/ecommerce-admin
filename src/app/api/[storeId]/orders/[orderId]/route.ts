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
  try {
    const { storeId, orderId } = await params;
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
      city,
      postalCode,
      country,
    } = body;

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });
    if (!store) return new NextResponse("Unauthorized", { status: 403 });

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const updateData: any = {
      status: status || existingOrder.status,
      shippingMethod: shippingMethod !== undefined ? shippingMethod : null,
      shippingCost: shippingCost !== undefined ? Number(shippingCost) : null,
      trackingNumber: trackingNumber !== undefined ? trackingNumber : null,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : null,
      transactionId: transactionId !== undefined ? transactionId : null,
      customerNote: customerNote !== undefined ? customerNote : null,
      adminNote: adminNote !== undefined ? adminNote : null,
      email: email !== undefined ? email : null,
      city: city !== undefined ? city : null,
      postalCode: postalCode !== undefined ? postalCode : null,
      country: country !== undefined ? country : null,
    };

    // Logic: Chỉ cập nhật isPaid cho COD khi status = DELIVERED
    // Với thanh toán trực tuyến, isPaid đã được set = true khi tạo order
    if (
      status === "DELIVERED" &&
      existingOrder.paymentMethod === "COD" &&
      !existingOrder.isPaid
    ) {
      updateData.isPaid = true;
    }

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: updateData,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_PATCH_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
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

    const order = await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_DELETE_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
