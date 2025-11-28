import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { HeaderWrapper } from "@/components/header-wrapper";
import { SidebarToggleScript } from "@/components/sidebar-toggle-script";
import { cn } from "@/lib/utils";

// Danh sách email được phép truy cập Admin
const ADMIN_ALLOWED_EMAILS = process.env.ADMIN_ALLOWED_EMAILS?.split(",").map(e => e.trim()) || [];

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
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
      console.error("[DASHBOARD_LAYOUT] Error checking email:", error);
      redirect("/unauthorized");
    }
  }

  const { storeId } = await params;

  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      userId,
    },
  });

  if (!store) {
    redirect("/");
  }

  const stores = await prisma.store.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarToggleScript />
      {/* Sidebar - Desktop */}
      <SidebarWrapper stores={stores} />

      {/* Main Content Area */}
      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300 lg:pl-64"
        id="main-content"
      >
        {/* Header */}
        <HeaderWrapper stores={stores} />

        {/* Page Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto",
            "px-4 md:px-6 lg:px-8 py-6",
            // Glass effect background
            "bg-gradient-to-br from-gray-50/50 via-white/30 to-gray-100/50",
            "dark:from-gray-950/50 dark:via-gray-900/30 dark:to-gray-950/50",
            "backdrop-blur-3xl"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
