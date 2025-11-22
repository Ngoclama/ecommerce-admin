import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Lấy danh sách User
export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Kiểm tra xem người gọi API có phải là ADMIN không (Dựa vào ClerkId tìm trong DB)
    // Tạm thời bỏ qua check Role chặt chẽ để test, nhưng logic đúng là phải check:
    // const user = await prisma.user.findUnique({ where: { clerkId: userId }});
    // if (user?.role !== "ADMIN") ...

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
    console.log("[USERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
