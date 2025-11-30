import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { API_MESSAGES, HTTP_STATUS } from "@/lib/constants";
import { devError } from "@/lib/api-utils";

// Lấy thông tin chi tiết User
export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string; userId: string }> }
) {
  try {
    const { storeId, userId: targetUserId } = await params;
    const { userId: currentAdminId } = await auth();

    if (!currentAdminId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    if (!targetUserId) {
      return new NextResponse(API_MESSAGES.ID_REQUIRED, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    if (!storeId) {
      return new NextResponse("Store ID is required", {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Tối ưu: chỉ select các field cần thiết
    const user = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        imageUrl: true,
        role: true,
        isVIP: true,
        isBanned: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            stores: true,
            orders: {
              where: {
                storeId: storeId, // Đếm orders trong store này
              },
            },
            reviews: {
              where: {
                product: {
                  storeId: storeId, // Đếm reviews trong store này
                },
              },
            },
            addresses: true,
            wishlist: {
              where: {
                product: {
                  storeId: storeId, // Đếm wishlist trong store này
                },
              },
            },
            returns: {
              where: {
                order: {
                  storeId: storeId, // Đếm returns trong store này
                },
              },
            },
          },
        },
        orders: {
          where: {
            storeId: storeId, // Chỉ lấy orders trong store này
          },
          select: {
            id: true,
            total: true,
            status: true,
            isPaid: true,
            paymentMethod: true,
            createdAt: true,
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
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Tăng lên 10 đơn hàng gần nhất
        },
      },
    });

    if (!user) {
      return new NextResponse(API_MESSAGES.NOT_FOUND, {
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    // Debug log
    console.log("[USER_GET] User data:", {
      userId: user.id,
      storeId,
      ordersCount: user.orders?.length || 0,
      _countOrders: user._count.orders,
    });

    return NextResponse.json(user);
  } catch (error) {
    devError("[USER_GET] Lỗi khi lấy thông tin user:", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

// Cập nhật thông tin User (VIP, Ban, Role)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ storeId: string; userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;
    const { userId: currentAdminId } = await auth();
    const body = await req.json();
    const { isVIP, isBanned, role } = body;

    if (!currentAdminId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const user = await prisma.user.update({
      where: {
        id: targetUserId, // ID Mongo
      },
      data: {
        isVIP,
        isBanned,
        role,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    devError("[USER_PATCH] Lỗi khi cập nhật user:", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

// Xóa User (Chỉ xóa trong DB, không xóa bên Clerk)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string; userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const user = await prisma.user.delete({
      where: {
        id: targetUserId,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    devError("[USER_DELETE] Lỗi khi xóa user:", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
