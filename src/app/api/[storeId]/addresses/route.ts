import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Tạo địa chỉ mới
export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    const body = await req.json();
    const { label, phone, address, city, isDefault } = body;

    if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });
    if (!user) return new NextResponse("User Sync Error", { status: 404 });

    // Nếu set là default, bỏ default của các địa chỉ khác
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        label, // Ví dụ: "Nhà riêng", "Công ty"
        phone,
        address,
        city,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(newAddress);
  } catch (error) {
    console.log("[ADDRESS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Lấy danh sách địa chỉ
export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" }, // Default lên đầu
    });

    return NextResponse.json(addresses);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
