import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Danh sách email được phép truy cập Admin
const ADMIN_ALLOWED_EMAILS =
  process.env.ADMIN_ALLOWED_EMAILS?.split(",").map((e) => e.trim()) || [];

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Kiểm tra email nếu có cấu hình ADMIN_ALLOWED_EMAILS
  if (ADMIN_ALLOWED_EMAILS.length > 0 && !ADMIN_ALLOWED_EMAILS.includes("*")) {
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      const userEmail = user.emailAddresses[0]?.emailAddress;

      if (!userEmail || !ADMIN_ALLOWED_EMAILS.includes(userEmail)) {
        redirect("/unauthorized");
      }
    } catch (error) {
      console.error("[SETUP_LAYOUT] Error checking email:", error);
      redirect("/unauthorized");
    }
  }

  const store = await prisma.store.findFirst({
    where: {
      userId,
    },
  });

  if (store) {
    redirect(`/${store.id}`);
  }

  return <>{children}</>;
}
