"use client";

import { UserButton } from "@clerk/nextjs";
import ClientOnly from "./ClientOnly";

const NavbarUser = () => {
  return (
    <div className="ml-auto flex items-center space-x-4">
      <ClientOnly>
        <UserButton afterSignOutUrl="/" />
      </ClientOnly>
    </div>
  );
};

export default NavbarUser;
