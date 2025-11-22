import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Cập nhật thông tin User (VIP, Ban, Role)
export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; userId: string } }
) {
  try {
    const { userId: currentAdminId } = await auth();
    const body = await req.json();
    const { isVIP, isBanned, role } = body;

    if (!currentAdminId)
      return new NextResponse("Unauthenticated", { status: 401 });

    const user = await prisma.user.update({
      where: {
        id: params.userId, // ID Mongo
      },
      data: {
        isVIP,
        isBanned,
        role,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.log("[USER_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Xóa User (Chỉ xóa trong DB, không xóa bên Clerk)
export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string; userId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    const user = await prisma.user.delete({
      where: {
        id: params.userId,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.log("[USER_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
