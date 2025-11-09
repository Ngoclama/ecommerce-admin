"use client";

import { UserButton } from "@clerk/nextjs";

const NavbarUser = () => {
  return (
    <div className="ml-auto flex items-center space-x-4">
      <UserButton afterSignOutUrl="/" />
    </div>
  );
};

export default NavbarUser;
