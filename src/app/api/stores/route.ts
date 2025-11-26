import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, address, phone, email } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    // Kiểm tra định dạng email nếu có
    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Chỉ thêm các trường có giá trị
    const storeData: any = {
      name: name.trim(),
      userId,
    };

    // Thêm các trường tùy chọn nếu có giá trị
    if (address && address.trim()) {
      storeData.address = address.trim();
    }
    if (phone && phone.trim()) {
      storeData.phone = phone.trim();
    }
    if (email && email.trim()) {
      storeData.email = email.trim();
    }

    const store = await prisma.store.create({
      data: storeData,
    });

    return NextResponse.json(
      { success: true, data: store, id: store.id },
      { status: 201 }
    );
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("[STORE_POST] Error:", error);
    }

    // Xử lý lỗi trùng tên cửa hàng
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "Store name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const stores = await prisma.store.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: stores });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[STORE_GET]", error);
    }
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
