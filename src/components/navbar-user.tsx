"use client";

import { UserButton } from "@clerk/nextjs";
import ClientOnly from "./ClientOnly";

import { ModeToggle } from "@/components/mode-toggle"; // Import ModeToggle
import StoreSwitcher from "./store-switcher"; // Import StoreSwitcher (nếu nằm ở đây)

interface NavbarUserProps {
  items: any[];
}

const NavbarUser: React.FC<NavbarUserProps> = ({ items }) => {
  return (
    <div className="ml-auto flex items-center space-x-4">

      <ModeToggle />

      <ClientOnly>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              userButtonAvatarBox:
                "w-10 h-10 rounded-xl transition-all duration-300 hover:ring-2 hover:ring-primary/50",
              userButtonPopoverCard:
                "rounded-xl border border-white/20 dark:border-neutral-700/50 backdrop-blur-xl",
            },
          }}
        />
      </ClientOnly>
    </div>
  );
};

export default NavbarUser;
