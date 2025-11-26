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

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderForm initialData={order} />
      </div>
    </div>
  );
};

export default OrderPage;
