import prisma from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { storeId: string } }) {
  try {
    const body = await request.json();
    const { name } = body;
    const { storeId } = params;

    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: { name },
    });

    return new Response(JSON.stringify(store), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}



export async function DELETE(request: Request, { params }: { params: { storeId: string } }) {
  try {
    const { storeId } = params;

    await prisma.store.delete({
      where: { id: storeId },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to delete store" }), { status: 500 });
  }
}
 


export async function GET(request: Request, { params }: { params: { storeId: string } }) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: params.storeId },
    });

    if (!store) {
      return new Response(JSON.stringify({ error: "Store not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(store), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}




export async function PUT(request: Request, { params }: { params: { storeId: string } }) {
  try {
    const { storeId } = params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const existingStore = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!existingStore) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: { name },
    });

    return new Response(JSON.stringify(store), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PUT /store error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

