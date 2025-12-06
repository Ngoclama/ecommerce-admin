import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * DELETE /api/orders/[id]/cancel-payment
 * Delete order when payment is cancelled (only for unpaid PENDING orders)
 * This endpoint is called when user cancels payment before completing it
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      // Order already deleted or doesn't exist - return success
      return NextResponse.json({
        message: "Order not found or already deleted",
        deleted: true,
      });
    }

    // Only allow deletion of unpaid PENDING orders
    if (order.isPaid) {
      return NextResponse.json(
        { message: "Cannot delete paid order" },
        { status: 400 }
      );
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { message: `Cannot delete order with status: ${order.status}` },
        { status: 400 }
      );
    }

    // Delete order (cascade will delete orderItems automatically)
    await prisma.order.delete({
      where: { id },
    });

    console.log("[CANCEL_PAYMENT] Order deleted:", {
      orderId: id,
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod,
    });

    return NextResponse.json({
      message: "Order deleted successfully",
      deleted: true,
    });
  } catch (error) {
    console.error("[CANCEL_PAYMENT_ERROR]", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

