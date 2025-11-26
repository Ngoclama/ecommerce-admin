// API route để quản lý shipping orders
// GET: Lấy danh sách tất cả vận đơn của store
// POST: Tạo vận đơn mới cho một đơn hàng

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getShippingProvider } from "@/lib/shipping";

/**
 * GET: Lấy danh sách tất cả shipping orders của store
 * Trả về kèm thông tin đơn hàng và sản phẩm trong đơn
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();

    // Kiểm tra user đã đăng nhập chưa
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Kiểm tra store có thuộc về user này không
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Lấy tất cả shipping orders của store, sắp xếp mới nhất trước
    // Include thông tin đơn hàng và sản phẩm để hiển thị đầy đủ
    const shippings = await prisma.shipping.findMany({
      where: {
        storeId: storeId,
      },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: true, // Lấy thông tin sản phẩm trong đơn
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Mới nhất trước
      },
    });

    return NextResponse.json(shippings);
  } catch (error) {
    console.error("[SHIPPING_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

/**
 * POST: Tạo shipping order mới cho một đơn hàng
 * Sẽ gọi API của shipping provider (GHN, ViettelPost, etc.) để tạo vận đơn
 * Sau đó lưu thông tin vào database
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    // Lấy các thông tin từ request body
    const {
      orderId, // ID đơn hàng cần tạo vận đơn
      provider, // Nhà vận chuyển (GHN, VIETTELPOST, GHTK, CUSTOM)
      shippingMethod, // Phương thức giao hàng
      fromAddress, // Địa chỉ người gửi
      fromPhone, // SĐT người gửi
      fromName, // Tên người gửi
      toAddress, // Địa chỉ người nhận
      toPhone, // SĐT người nhận
      toName, // Tên người nhận
      toCity, // Thành phố người nhận
      toDistrict, // Quận/huyện người nhận
      toWard, // Phường/xã người nhận
      weight, // Trọng lượng (gram)
      codAmount, // Số tiền thu hộ
      note, // Ghi chú
    } = body;

    // Kiểm tra authentication
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Kiểm tra store có thuộc về user không
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Kiểm tra đơn hàng có tồn tại và thuộc về store này không
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        storeId: storeId,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Kiểm tra xem đơn hàng này đã có shipping order chưa
    // Một đơn hàng chỉ nên có một shipping order
    const existingShipping = await prisma.shipping.findFirst({
      where: { orderId: orderId },
    });

    if (existingShipping) {
      return new NextResponse("Shipping order already exists for this order", {
        status: 400,
      });
    }

    // Lấy instance của shipping provider tương ứng
    // Nếu không chỉ định provider thì dùng CUSTOM
    const shippingProvider = getShippingProvider(provider || "CUSTOM");

    // Gọi API của provider để tạo vận đơn
    // Provider sẽ trả về tracking number và các thông tin khác
    const providerResponse = await shippingProvider.createOrder({
      orderId,
      fromAddress: fromAddress || store.address || "", // Dùng địa chỉ store nếu không có
      fromPhone: fromPhone || store.phone || "", // Dùng SĐT store nếu không có
      fromName: store.name, // Tên store
      toAddress,
      toPhone,
      toName,
      toCity,
      toDistrict,
      toWard,
      weight: weight || 1000, // Mặc định 1kg nếu không có
      codAmount: codAmount || order.total, // Dùng tổng tiền đơn hàng nếu không có
      note,
    });

    // Nếu provider trả về lỗi thì báo lỗi
    if (!providerResponse.success) {
      return NextResponse.json(
        { error: providerResponse.error || "Failed to create shipping order" },
        { status: 400 }
      );
    }

    // Lưu thông tin shipping vào database
    const shipping = await prisma.shipping.create({
      data: {
        orderId,
        storeId,
        provider: provider || "CUSTOM",
        providerOrderId: providerResponse.providerOrderId, // ID từ phía provider
        trackingNumber: providerResponse.trackingNumber, // Mã vận đơn
        status: "CREATED", // Trạng thái ban đầu
        shippingMethod: shippingMethod || "Standard",
        shippingCost: providerResponse.fee || 0, // Phí vận chuyển
        fromAddress: fromAddress || store.address || "",
        fromPhone: fromPhone || store.phone || "",
        fromName: store.name,
        toAddress,
        toPhone,
        toName,
        toCity: toCity || null,
        toDistrict: toDistrict || null,
        toWard: toWard || null,
        providerData: JSON.stringify(providerResponse.data || {}), // Lưu thêm data từ provider
      },
      include: {
        order: true, // Include thông tin đơn hàng trong response
      },
    });

    // Cập nhật đơn hàng với tracking number và thông tin shipping
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: providerResponse.trackingNumber,
        shippingMethod: shippingMethod || "Standard",
        shippingCost: providerResponse.fee || 0,
      },
    });

    return NextResponse.json(shipping, { status: 201 });
  } catch (error) {
    console.error("[SHIPPING_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

/**
 * DELETE: Xóa shipping orders
 * Có thể xóa tất cả hoặc xóa theo danh sách IDs
 */
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

    // Check if request body has specific IDs to delete
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

    let shippingIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific shipping orders by IDs
      const shippingsToDelete = await prisma.shipping.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      shippingIds = shippingsToDelete.map((s) => s.id);

      if (shippingIds.length === 0) {
        return NextResponse.json(
          {
            message: "No valid shipping orders found to delete.",
          },
          { status: 400 }
        );
      }
    } else {
      // Delete all shipping orders (original behavior)
      const shippingsToDelete = await prisma.shipping.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      shippingIds = shippingsToDelete.map((s) => s.id);
    }

    const result = await prisma.shipping.deleteMany({
      where: {
        id: { in: shippingIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${result.count} shipping orders.`,
      count: result.count,
    });
  } catch (error: any) {
    console.error("[SHIPPING_DELETE_ALL_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
