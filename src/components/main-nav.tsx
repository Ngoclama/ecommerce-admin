"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pathname = usePathname();
  const params = useParams();

  const routes = [
    {
      href: `/${params.storeId}`,
      label: "Overview",
    },
    {
      href: `/${params.storeId}/billboards`,
      label: "Billboards",
    },
    {
      href: `/${params.storeId}/categories`,
      label: "Categories",
    },
    {
      href: `/${params.storeId}/sizes`,
      label: "Sizes",
    },
    {
      href: `/${params.storeId}/colors`,
      label: "Colors",
    },
    {
      href: `/${params.storeId}/products`,
      label: "Products",
    },

    {
      href: `/${params.storeId}/orders`,
      label: "Orders",
    },
    {
      href: `/${params.storeId}/settings`,
      label: "Settings",
    },
  ];

  if (!isMounted) {
    return null;
  }

  return (
    <nav
      className={cn(
        "relative flex items-center gap-3 lg:gap-5 px-4 py-2 rounded-2xl",
        "backdrop-blur-xl bg-white/10 dark:bg-white/5",
        "border border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
        "ring-1 ring-white/20",
        "transition-all duration-300",
        className
      )}
    >
      {routes.map((route) => {
        const active = pathname === route.href;

        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "relative flex items-center justify-center px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200",
              active ? "text-black" : "text-black/70 hover:text-black"
            )}
          >
            {active && (
              <motion.div
                layoutId="activeNav"
                className="absolute inset-0 rounded-lg bg-white/20 backdrop-blur-sm shadow-inner"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{route.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
