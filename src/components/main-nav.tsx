"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Box } from "lucide-react";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const params = useParams();

  const routes = [
    {
      href: `/${params.storeId}`,
      label: "Overview",
      active: pathname === `/${params.storeId}`,
    },
    {
      href: `/${params.storeId}/users`,
      label: "Users",
      active: pathname === `/${params.storeId}/users`,
    },
    {
      href: `/${params.storeId}/billboards`,
      label: "Billboards",
      active: pathname.includes("billboards"),
    },
    {
      href: `/${params.storeId}/categories`,
      label: "Categories",
      active: pathname.includes("categories"),
    },
  ];

  const productDropdownRoutes = [
    {
      href: `/${params.storeId}/products`,
      label: "Products List",
      active: pathname === `/${params.storeId}/products`,
    },
    {
      href: `/${params.storeId}/sizes`,
      label: "Sizes",
      active: pathname.includes("sizes"),
    },
    {
      href: `/${params.storeId}/colors`,
      label: "Colors",
      active: pathname.includes("colors"),
    },
    {
      href: `/${params.storeId}/materials`,
      label: "Materials",
      active: pathname.includes("materials"),
    },
    {
      href: `/${params.storeId}/coupons`,
      label: "Coupons",
      active: pathname.includes("coupons"),
    },
  ];

  const endRoutes = [
    {
      href: `/${params.storeId}/orders`,
      label: "Orders",
      active: pathname.includes("orders"),
    },
    {
      href: `/${params.storeId}/reviews`,
      label: "Reviews",
      active: pathname.includes("reviews"),
    },
    {
      href: `/${params.storeId}/settings`,
      label: "Settings",
      active: pathname.includes("settings"),
    },
  ];

  const isDropdownActive = productDropdownRoutes.some((route) => route.active);

  const glassEffect =
    "bg-white/60 dark:bg-black/60 backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-lg";

  return (
    <nav
      className={cn(
        "flex items-center space-x-4 lg:space-x-6 rounded-2xl px-4 py-2 transition-all duration-300",
        glassEffect,
        className
      )}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10",
            route.active
              ? "text-black dark:text-white font-semibold bg-white/40 dark:bg-white/10 shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary outline-none px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10",
            isDropdownActive
              ? "text-black dark:text-white bg-white/40 dark:bg-white/10 shadow-sm"
              : "text-muted-foreground"
          )}
        >
          <Box className="mr-2 h-4 w-4" /> Products{" "}
          <ChevronDown
            className={`ml-1 h-3 w-3 transition-transform duration-200 ${
              isDropdownActive ? "rotate-180" : ""
            }`}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className={cn(
            "w-48 mt-2 p-1",
            glassEffect,
            "border-none ring-1 ring-black/5"
          )}
        >
          {productDropdownRoutes.map((route) => (
            <DropdownMenuItem key={route.href} asChild>
              <Link
                href={route.href}
                className={cn(
                  "w-full cursor-pointer rounded-md px-2 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
                  route.active
                    ? "font-bold bg-primary/10 text-primary"
                    : "text-neutral-700 dark:text-neutral-200"
                )}
              >
                {route.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {endRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10",
            route.active
              ? "text-black dark:text-white font-semibold bg-white/40 dark:bg-white/10 shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
