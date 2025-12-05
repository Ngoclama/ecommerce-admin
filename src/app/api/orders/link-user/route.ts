import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getUserFromDb } from "@/lib/permissions";

/**
 * API để link các đơn hàng chưa có userId với user hiện tại
 * Dựa trên email để match
 */
export async function POST(req: Request) {
  try {
    // Try to get userId from query params first (from store server proxy)
    const { searchParams } = new URL(req.url);
    const clerkUserIdFromQuery = searchParams.get("clerkUserId");

    // Also try to get from auth (direct call - may not work if cookies aren't forwarded)
    // NOTE: Nếu store và admin dùng 2 Clerk keys khác nhau, auth() sẽ không hoạt động
    // Vì cookies từ Clerk instance A không hợp lệ với Clerk instance B
    const { userId: clerkUserIdFromAuth } = await auth();

    // Ưu tiên query param từ store proxy (store đã authenticate rồi)
    // Chỉ dùng auth() nếu không có query param (direct call từ admin)
    const clerkUserId = clerkUserIdFromQuery || clerkUserIdFromAuth;

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Nếu có query param từ store proxy, trust nó hoàn toàn
    // Vì store và admin có thể dùng 2 Clerk keys khác nhau
    // Cookies từ Clerk A không hợp lệ với Clerk B
    if (clerkUserIdFromQuery) {
      // Store đã authenticate rồi, trust query param
      console.log(
        "[LINK_ORDERS] Using clerkUserId from query param (store proxy):",
        clerkUserIdFromQuery
      );
    } else if (clerkUserIdFromAuth) {
      // Direct call từ admin (cùng Clerk instance)
      console.log(
        "[LINK_ORDERS] Using clerkUserId from auth (direct call):",
        clerkUserIdFromAuth
      );
    } else {
      // Không có cả hai → unauthenticated
    }

    // Lấy user từ database
    const user = await getUserFromDb(clerkUserId);
    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, message: "User not found or no email" },
        { status: 404 }
      );
    }

    // Tìm và link các đơn hàng chưa có userId nhưng có cùng email
    const result = await prisma.order.updateMany({
      where: {
        userId: null, // Chưa có userId
        email: user.email, // Cùng email với user
      },
      data: {
        userId: user.id, // Link với user
      },
    });

    console.log("[LINK_ORDERS] Linked orders to user:", {
      userId: user.id,
      email: user.email,
      linkedCount: result.count,
    });

    return NextResponse.json({
      success: true,
      linkedCount: result.count,
      message: `Đã liên kết ${result.count} đơn hàng với tài khoản của bạn.`,
    });
  } catch (error: any) {
    console.error("[LINK_ORDERS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to link orders",
      },
      { status: 500 }
    );
  }
}
