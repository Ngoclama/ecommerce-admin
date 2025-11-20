import { MainNav } from "./main-nav";
import StoreSwitcher from "./store-switcher";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import NavbarUser from "./navbar-user";
import ClientOnly from "./ClientOnly";

const Navbar = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const stores = await prisma.store.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <ClientOnly>
          <StoreSwitcher items={stores} />
        </ClientOnly>
        <MainNav className="mx-6" />
        <NavbarUser />
      </div>
    </div>
  );
};

export default Navbar;
