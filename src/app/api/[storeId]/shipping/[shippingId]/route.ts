import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getShippingProvider } from "@/lib/shipping";

// GET: Lấy chi tiết shipping
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string; shippingId: string }> }
) {
  try {
    const { storeId, shippingId } = await params;
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

    const shipping = await prisma.shipping.findUnique({
      where: { id: shippingId },
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
      },
    });

    if (!shipping || shipping.storeId !== storeId) {
      return new NextResponse("Shipping not found", { status: 404 });
    }

    return NextResponse.json(shipping);
  } catch (error) {
    console.error("[SHIPPING_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH: Cập nhật shipping status và tracking
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; shippingId: string }> }
) {
  try {
    const { storeId, shippingId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const { status, trackingNumber } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const shipping = await prisma.shipping.findUnique({
      where: { id: shippingId },
    });

    if (!shipping || shipping.storeId !== storeId) {
      return new NextResponse("Shipping not found", { status: 404 });
    }

    // If status changed to DELIVERED, update deliveredAt
    const updateData: any = {};
    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (status === "DELIVERED" && shipping.status !== "DELIVERED") {
      updateData.deliveredAt = new Date();
    }
    if (status === "PICKED_UP" && shipping.status !== "PICKED_UP") {
      updateData.pickedUpAt = new Date();
    }

    const updatedShipping = await prisma.shipping.update({
      where: { id: shippingId },
      data: updateData,
      include: {
        order: true,
      },
    });

    // Update order tracking number if provided
    if (trackingNumber && shipping.orderId) {
      await prisma.order.update({
        where: { id: shipping.orderId },
        data: { trackingNumber },
      });
    }

    return NextResponse.json(updatedShipping);
  } catch (error) {
    console.error("[SHIPPING_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE: Xóa shipping
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; shippingId: string }> }
) {
  try {
    const { storeId, shippingId } = await params;
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

    const shipping = await prisma.shipping.findUnique({
      where: { id: shippingId },
    });

    if (!shipping || shipping.storeId !== storeId) {
      return new NextResponse("Shipping not found", { status: 404 });
    }

    // Cancel order with provider if status is CREATED or later
    if (["CREATED", "PICKED_UP", "IN_TRANSIT"].includes(shipping.status)) {
      try {
        const provider = getShippingProvider(shipping.provider);
        if (shipping.providerOrderId) {
          await provider.cancelOrder(shipping.providerOrderId);
        }
      } catch (error) {
        console.error("[SHIPPING_CANCEL_PROVIDER]", error);
        // Continue with deletion even if cancel fails
      }
    }

    await prisma.shipping.delete({
      where: { id: shippingId },
    });

    return NextResponse.json({ message: "Shipping deleted successfully" });
  } catch (error) {
    console.error("[SHIPPING_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
