import { MainNav } from "./main-nav";
import StoreSwitcher from "./store-switcher";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import NavbarUser from "./navbar-user";
import ClientOnly from "./ClientOnly";
import { cn } from "@/lib/utils"; 

const Navbar = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const stores = await prisma.store.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const glassEffect =
    "bg-white/60 dark:bg-black/60 backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-lg";

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-3 md:p-4">
      <div
        className={cn(
          "flex h-16 items-center px-4 md:px-6 rounded-2xl transition-all duration-300",
          glassEffect
        )}
      >
        <ClientOnly>
          <StoreSwitcher items={stores} />
        </ClientOnly>

        <MainNav className="mx-6 hidden md:flex" />

        <div className="ml-auto">
          <NavbarUser items={stores} />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
