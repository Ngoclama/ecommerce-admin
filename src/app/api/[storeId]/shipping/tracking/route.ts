import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getShippingProvider } from "@/lib/shipping";

// POST: Lấy tracking info từ provider
export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const { trackingNumber, shippingId } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    if (!trackingNumber && !shippingId) {
      return new NextResponse("Tracking number or shipping ID required", {
        status: 400,
      });
    }

    let shipping;
    if (shippingId) {
      shipping = await prisma.shipping.findUnique({
        where: { id: shippingId },
      });
      if (!shipping || shipping.storeId !== storeId) {
        return new NextResponse("Shipping not found", { status: 404 });
      }
    } else {
      shipping = await prisma.shipping.findUnique({
        where: { trackingNumber },
      });
      if (!shipping || shipping.storeId !== storeId) {
        return new NextResponse("Shipping not found", { status: 404 });
      }
    }

    // Get tracking from provider
    const provider = getShippingProvider(shipping.provider);
    const tracking = await provider.getTracking(shipping.trackingNumber);

    if (!tracking.success) {
      return NextResponse.json(
        { error: tracking.error || "Failed to get tracking" },
        { status: 400 }
      );
    }

    // Update shipping status if changed
    if (tracking.status && tracking.status !== shipping.status) {
      await prisma.shipping.update({
        where: { id: shipping.id },
        data: {
          status: tracking.status as any,
          providerData: JSON.stringify(tracking),
        },
      });
    }

    return NextResponse.json(tracking);
  } catch (error) {
    console.error("[SHIPPING_TRACKING]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
