import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { API_MESSAGES, HTTP_STATUS, COUPON_TYPES, DEFAULTS, PRISMA_ERROR_CODES } from "@/lib/constants";
import { devError } from "@/lib/api-utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    const body = await req.json();

    const { code, value, type, expiresAt } = body;

    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, { 
        status: HTTP_STATUS.UNAUTHORIZED 
      });
    }
    if (!code) {
      return new NextResponse(API_MESSAGES.CODE_REQUIRED, { 
        status: HTTP_STATUS.BAD_REQUEST 
      });
    }
    
    // Nếu không có value hoặc value <= 0, mặc định là 1
    const finalValue = value && value > 0 ? Number(value) : DEFAULTS.COUPON_VALUE;
    
    // Nếu không có type, mặc định là PERCENT
    const finalType = type || DEFAULTS.COUPON_TYPE;

    if (!storeId) {
      return new NextResponse(API_MESSAGES.STORE_ID_REQUIRED, { 
        status: HTTP_STATUS.BAD_REQUEST 
      });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 405 });

    // Validate ngày quá khứ
    if (expiresAt) {
      const selectedDate = new Date(expiresAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return NextResponse.json(
          {
            error: API_MESSAGES.EXPIRED_DATE_PAST,
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        storeId: storeId,
        code: code.trim().toUpperCase(),
      },
    });

    if (existingCoupon) {
      return NextResponse.json(
        {
          error: `${API_MESSAGES.DUPLICATE_CODE}: "${code.trim().toUpperCase()}". Vui lòng đổi tên mã và thử lại.`,
        },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        value: finalValue,
        type: finalType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        storeId: storeId,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[COUPONS_POST]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    if (!storeId)
      return new NextResponse("Store id is required", { status: 400 });

    const coupons = await prisma.coupon.findMany({
      where: { storeId: storeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    devError("[COUPONS_GET] Lỗi khi lấy danh sách coupon:", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, { 
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR 
    });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse(API_MESSAGES.UNAUTHENTICATED, { 
        status: HTTP_STATUS.UNAUTHORIZED 
      });
    }

    if (!storeId) {
      return new NextResponse(API_MESSAGES.STORE_ID_REQUIRED, { 
        status: HTTP_STATUS.BAD_REQUEST 
      });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 405 });

    // Kiểm tra request body có chứa IDs cụ thể để xóa không
    let body: { ids?: string[] } = {};
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 0) {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const idsToDelete = body.ids;

    let couponIds: string[];

    if (idsToDelete && Array.isArray(idsToDelete) && idsToDelete.length > 0) {
      // Delete specific coupons by IDs
      const couponsToDelete = await prisma.coupon.findMany({
        where: {
          id: { in: idsToDelete },
          storeId: storeId,
        },
        select: { id: true },
      });

      couponIds = couponsToDelete.map((c) => c.id);

      if (couponIds.length === 0) {
        return NextResponse.json(
          {
            message: "Không tìm thấy coupon hợp lệ để xóa.",
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    } else {
      // Delete all coupons (original behavior)
      const couponsToDelete = await prisma.coupon.findMany({
        where: { storeId: storeId },
        select: { id: true },
      });

      couponIds = couponsToDelete.map((c) => c.id);
    }

    const result = await prisma.coupon.deleteMany({
      where: {
        id: { in: couponIds },
        storeId: storeId,
      },
    });

    return NextResponse.json({
      message: `Đã xóa thành công ${result.count} coupon.`,
      count: result.count,
    });
  } catch (error) {
    devError("[COUPONS_DELETE_ALL] Lỗi khi xóa coupon:", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, { 
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR 
    });
  }
}
