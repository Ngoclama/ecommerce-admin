import prisma from "@/lib/prisma";
import { OrderForm } from "./components/order-form";
import { ObjectId } from "bson";

const OrderPage = async ({
  params,
}: {
  params: Promise<{ orderId: string; storeId: string }>;
}) => {
  const { orderId } = await params;
  const isValidId = ObjectId.isValid(orderId);

  if (!isValidId) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <p>Invalid order ID.</p>
        </div>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              images: {
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return (
      <div className="flex-col">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <p>Order not found.</p>
        </div>
      </div>
    );
  }

  // Transform order data to match OrderForm interface
  const transformedOrder = {
    ...order,
    orderItems: order.orderItems.map((item) => ({
      id: item.id,
      productName: item.productName || item.product.name || "",
      quantity: item.quantity,
      price: item.price,
      productPrice: item.productPrice,
      sizeName: item.sizeName,
      colorName: item.colorName,
      materialName: item.materialName,
      product: {
        id: item.product.id,
        name: item.product.name,
        images: item.product.images.map((img) => ({ url: img.url })),
      },
    })),
  } as typeof order & {
    orderItems: Array<{
      id: string;
      productName: string;
      quantity: number;
      price: number | null;
      productPrice: number | null;
      sizeName: string | null;
      colorName: string | null;
      materialName: string | null;
      product: {
        id: string;
        name: string;
        images: Array<{ url: string }>;
      };
    }>;
  };

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderForm initialData={transformedOrder} />
      </div>
    </div>
  );
};

export default OrderPage;
