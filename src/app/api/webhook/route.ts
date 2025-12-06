import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { userService } from "@/lib/services/user.service";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env"
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occured -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error occured", { status: 400 });
  }

  const eventType = evt.type;

  // 1. KHI USER ĐĂNG KÝ MỚI TRÊN CLERK -> TẠO USER TRONG MONGO
  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;

    // Use UserService to create user (handles race conditions)
    const clerkData = {
      email: email || `user_${id}@temp.com`,
      name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
      imageUrl: image_url || null,
    };

    const newUser = await userService.createUser(id, clerkData, false);

    // Link các đơn hàng chưa có userId nhưng có cùng email với user mới
    if (newUser && email) {
      const linkResult = await userService.linkOrdersByEmail(newUser.id, email);
      if (linkResult.linked > 0) {
        console.log(
          `[WEBHOOK] Linked ${linkResult.linked} orders to new user:`,
          newUser.id
        );
      }
    }
  }

  // 2. KHI USER UPDATE PROFILE TRÊN CLERK -> UPDATE MONGO
  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    // Use UserService to sync user from Clerk
    const updatedUser = await userService.syncUserFromClerk(id, false);

    // Link các đơn hàng chưa có userId nhưng có cùng email với user
    if (updatedUser && updatedUser.email) {
      const linkResult = await userService.linkOrdersByEmail(
        updatedUser.id,
        updatedUser.email
      );
      if (linkResult.linked > 0) {
        console.log(
          `[WEBHOOK] Linked ${linkResult.linked} orders to updated user:`,
          updatedUser.id
        );
      }
    }
  }

  // 3. KHI USER BỊ XÓA
  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      await prisma.user.delete({
        where: { clerkId: id },
      });
    }
  }

  return new NextResponse("", { status: 200 });
}
