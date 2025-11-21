import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  props: { params: Promise<{ storeId: string }> }
) {
  const params = await props.params;

  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const body = await req.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const data = rows
      .filter((r: any) => r.label && r.imageUrl)
      .map((r: any) => ({
        label: r.label,
        imageUrl: r.imageUrl,
        storeId: params.storeId,
      }));

    if (data.length === 0) {
      return new NextResponse("No valid billboards data found", { status: 400 });
    }

    const result = await prisma.billboard.createMany({
      data,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[BILLBOARDS_BULK_POST_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}