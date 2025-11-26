import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import slugify from "slugify";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });

    if (!storeId)
      return new NextResponse("Store ID is required", { status: 400 });

    const storeByUserId = await prisma.store.findFirst({
      where: { id: storeId, userId },
    });

    if (!storeByUserId)
      return new NextResponse("Unauthorized", { status: 403 });

    const body = await req.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows)) {
      return new NextResponse("Invalid data", { status: 400 });
    }

    const validData = rows
      .filter(
        (r: any) => r.name && r.price && r.categoryId && r.sizeId && r.colorId
      )
      .map((r: any) => {
        let slug = slugify(r.name, { lower: true, strict: true });
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;

        return {
          storeId: storeId,
          name: r.name,
          slug: slug,
          price: Math.round(Number(r.price)),
          description: r.description || "",
          categoryId: r.categoryId,
          sizeId: r.sizeId,
          colorId: r.colorId,
          materialId: r.materialId || null,
          isFeatured: r.isFeatured || false,
          isArchived: r.isArchived || false,
          inventory: r.inventory ? Number(r.inventory) : 10,
        };
      });

    if (validData.length === 0) {
      return new NextResponse("No valid products found", { status: 400 });
    }

    await prisma.product.createMany({
      data: validData,
    });

    return NextResponse.json({ success: true, count: validData.length });
  } catch (error) {
    console.error("[PRODUCTS_BULK_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
