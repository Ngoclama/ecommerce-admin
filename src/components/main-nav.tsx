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

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            route.active
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center text-sm  transition-colors hover:text-primary outline-none",
            isDropdownActive
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          <Box className="mr-1 h-4 w-4" /> Products {" "}
          <ChevronDown className="ml-1 h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {productDropdownRoutes.map((route) => (
            <DropdownMenuItem key={route.href} asChild>
              <Link
                href={route.href}
                className={cn(
                  "w-full cursor-pointer",
                  route.active
                    ? "font-bold bg-neutral-100 dark:bg-neutral-800"
                    : ""
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
            "text-sm font-medium transition-colors hover:text-primary",
            route.active
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
