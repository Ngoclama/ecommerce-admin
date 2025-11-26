import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET: Lấy chi tiết return
export async function GET(
  req: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  try {
    const { returnId } = await params;

    if (!returnId) {
      return new NextResponse("Return ID is required", { status: 400 });
    }

    const returnRequest = await prisma.return.findUnique({
      where: {
        id: returnId,
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
    });

    if (!returnRequest) {
      return new NextResponse("Return not found", { status: 404 });
    }

    return NextResponse.json(returnRequest);
  } catch (error) {
    console.error("[RETURN_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH: Cập nhật return status và xử lý refund
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; returnId: string }> }
) {
  try {
    const { storeId, returnId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const { status, refundAmount, refundMethod, adminNote } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Check store ownership
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Get return with order info
    const returnRequest = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        order: true,
      },
    });

    if (!returnRequest) {
      return new NextResponse("Return not found", { status: 404 });
    }

    // Verify return belongs to this store
    if (returnRequest.order.storeId !== storeId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Update return
    const updatedReturn = await prisma.return.update({
      where: { id: returnId },
      data: {
        status: status || undefined,
        refundAmount: refundAmount ? Number(refundAmount) : undefined,
        refundMethod: refundMethod || undefined,
        // Note: adminNote có thể thêm vào schema nếu cần
      },
      include: {
        order: {
          include: {
            orderItems: true,
          },
        },
        user: true,
        returnItems: true,
      },
    });

    // If status is APPROVED and order has transactionId, process refund via Stripe
    if (
      status === "APPROVED" &&
      returnRequest.order.transactionId &&
      refundAmount
    ) {
      try {
        // TODO: Integrate with Stripe refund API
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // await stripe.refunds.create({
        //   payment_intent: returnRequest.order.transactionId,
        //   amount: Math.round(refundAmount * 100), // Convert to cents
        //   reason: 'requested_by_customer',
        // });
        console.log(
          `[REFUND] Would process refund of ${refundAmount} for transaction ${returnRequest.order.transactionId}`
        );
      } catch (refundError) {
        console.error("[REFUND_ERROR]", refundError);
        // Don't fail the return update if refund fails, just log it
      }
    }

    return NextResponse.json(updatedReturn);
  } catch (error) {
    console.error("[RETURN_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE: Xóa return
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; returnId: string }> }
) {
  try {
    const { storeId, returnId } = await params;
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

    const returnRequest = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        order: true,
      },
    });

    if (!returnRequest) {
      return new NextResponse("Return not found", { status: 404 });
    }

    if (returnRequest.order.storeId !== storeId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await prisma.return.delete({
      where: { id: returnId },
    });

    return NextResponse.json({ message: "Return deleted successfully" });
  } catch (error) {
    console.error("[RETURN_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
