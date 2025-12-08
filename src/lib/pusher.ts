import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function triggerOrderStatusUpdate(
  userId: string,
  orderId: string,
  status: string,
  message: string
) {
  try {
    await pusherServer.trigger(`user-${userId}`, "order.status.updated", {
      orderId,
      status,
      message,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Pusher] Error triggering order.status.updated:", error);
    
  }
}

export async function triggerNotificationCreated(
  userId: string,
  notification: {
    id: string;
    orderId: string;
    message: string;
    type: string;
    createdAt: Date;
  }
) {
  try {
    await pusherServer.trigger(`user-${userId}`, "notification.created", {
      id: notification.id,
      orderId: notification.orderId,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[Pusher] Error triggering notification.created:", error);
  }
}
