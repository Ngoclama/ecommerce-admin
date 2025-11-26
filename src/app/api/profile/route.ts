import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const body = await req.json();
    const { name, phone, imageUrl } = body;

    // Tìm user theo clerkId
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Cập nhật thông tin user
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: name || user.name,
        phone: phone || user.phone,
        imageUrl: imageUrl || user.imageUrl,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("[PROFILE_UPDATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
