import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; billboardId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { label, imageUrl } = body;

    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!label)
      return NextResponse.json(
        { message: "Label is required" },
        { status: 400 }
      );
    if (!imageUrl)
      return NextResponse.json(
        { message: "Image URL is required" },
        { status: 400 }
      );

    const storeByUserId = await prisma.store.findFirst({
      where: { id: params.storeId, userId },
    });
    if (!storeByUserId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

    const billboard = await prisma.billboard.update({
      where: { id: params.billboardId },
      data: { label, imageUrl },
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.error("[BILLBOARD_PATCH]", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { billboardId: string } }
) {
  try {
    if (!params.billboardId) {
      return NextResponse.json(
        { message: "Billboard is required" },
        { status: 400 }
      );
    }
    const billboard = await prisma.billboard.findUnique({
      where: {
        id: params.billboardId,
      },
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.error("[Billboard_GET]", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { billboardId: string; storeId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { label, imageUrl } = body;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!label) {
      return NextResponse.json(
        { message: "Label is required" },
        { status: 400 }
      );
    }
    if (!imageUrl) {
      return NextResponse.json(
        { message: "ImageUrl is required" },
        { status: 400 }
      );
    }
    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });
    // if (!params.billboardId) {
    //   return new NextResponse("Billboard is required", { status: 400 });
    // }
    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const billboard = await prisma.billboard.update({
      where: {
        id: params.billboardId,
      },
      data: {
        label,
        imageUrl,
      },
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.error("[Billboard_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { billboardId: string; storeId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // if (!params.billboardId) {
    //   return new NextResponse("Billboard is required", { status: 400 });
    // }
    const storeByUserId = await prisma.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });
    if (!storeByUserId) {
      return new NextResponse("Unauthorized"), { status: 403 };
    }

    const billboard = await prisma.billboard.delete({
      where: {
        id: params.billboardId,
      },
    });

    return NextResponse.json(billboard);
  } catch (error) {
    console.error("[Billboard_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
