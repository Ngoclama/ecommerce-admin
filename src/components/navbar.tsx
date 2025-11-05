import { UserButton } from "@clerk/nextjs";
import { MainNav } from "./main-nav";
import StoreSwitcher from "./store-switcher";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
const Navbar = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  const stores = await prisma.store.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <StoreSwitcher items={stores}></StoreSwitcher>
        {/* <div>this routes</div> */}
        <MainNav className="mx-6"></MainNav>
        <div className="ml-auto flex items-center space-x-4">
          <UserButton></UserButton>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
