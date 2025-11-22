import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth(); // Đây là Clerk ID
    const { productId } = await req.json();

    if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });
    if (!productId)
      return new NextResponse("Product ID required", { status: 400 });

    // 1. Tìm User Mongo ID từ Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) return new NextResponse("User not found in DB", { status: 404 });

    // 2. Kiểm tra xem đã like chưa
    const existingWishlist = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id, // Dùng Mongo ID
          productId,
        },
      },
    });

    if (existingWishlist) {
      // Nếu có rồi -> Xóa (Unlike)
      await prisma.wishlist.delete({
        where: { id: existingWishlist.id },
      });
      return NextResponse.json({ isLiked: false });
    } else {
      // Chưa có -> Tạo mới (Like)
      await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId,
        },
      });
      return NextResponse.json({ isLiked: true });
    }
  } catch (error) {
    console.error("[WISHLIST_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Lấy danh sách wishlist của user
export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { images: true, category: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
