import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { HeaderWrapper } from "@/components/header-wrapper";
import { SidebarToggleScript } from "@/components/sidebar-toggle-script";
import { cn } from "@/lib/utils";

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
