import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { API_MESSAGES, HTTP_STATUS } from "@/lib/constants";
import { devError } from "@/lib/api-utils";

// Lấy danh sách User
export async function GET(
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

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        orders: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    devError("[USERS_GET] Lỗi khi lấy danh sách users:", error);
    return new NextResponse(API_MESSAGES.SERVER_ERROR, { 
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR 
    });
  }
}
