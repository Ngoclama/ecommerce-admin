import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import slugify from "slugify"; // Đảm bảo đã cài: npm install slugify

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!params.storeId) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await req.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows)) {
      return new NextResponse("Invalid data format", { status: 400 });
    }

    const data = rows
      .filter((r: any) => r.name && r.billboardId)
      .map((r: any) => {
        let slug = slugify(r.name, { lower: true, strict: true });

        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;

        return {
          name: r.name,
          slug: slug,
          billboardId: r.billboardId,
          storeId: params.storeId,
        };
      });

    if (data.length === 0) {
      return new NextResponse("No valid categories to import", { status: 400 });
    }

    await prisma.category.createMany({
      data,
    });

    return NextResponse.json({ success: true, count: data.length });
  } catch (error) {
    console.error("[CATEGORIES_BULK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
