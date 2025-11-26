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
import {
  ChevronDown,
  Box,
  LayoutDashboard,
  Users,
  Image,
  FolderTree,
  ShoppingCart,
  Star,
  Settings,
  Package,
  Ruler,
  Palette,
  Layers,
  Ticket,
  Zap,
  RotateCcw,
  Truck,
  FileText,
  BarChart3,
  User,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";

interface NewCounts {
  newProductsCount: number;
  newBillboardsCount: number;
}

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const params = useParams();
  const { t } = useTranslation();
  const [newCounts, setNewCounts] = useState<NewCounts>({
    newProductsCount: 0,
    newBillboardsCount: 0,
  });

  // Fetch new counts
  useEffect(() => {
    if (params.storeId) {
      const fetchNewCounts = async () => {
        try {
          const res = await axios.get<NewCounts>(
            `/api/${params.storeId}/stats/new-counts`
          );
          setNewCounts(res.data);
        } catch (error) {
          // Silent fail - không hiển thị lỗi nếu không fetch được
        }
      };
      fetchNewCounts();
      // Refresh mỗi 30 giây
      const interval = setInterval(fetchNewCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [params.storeId]);

  const routes = [
    {
      href: `/${params.storeId}`,
      label: t("nav.overview"),
      icon: LayoutDashboard,
      active: pathname === `/${params.storeId}`,
    },
    {
      href: `/${params.storeId}/users`,
      label: t("nav.users"),
      icon: Users,
      active: pathname === `/${params.storeId}/users`,
    },
    {
      href: `/${params.storeId}/billboards`,
      label: t("nav.billboards"),
      icon: Image,
      active: pathname.includes("billboards"),
      badge:
        newCounts.newBillboardsCount > 0
          ? newCounts.newBillboardsCount
          : undefined,
    },
    {
      href: `/${params.storeId}/categories`,
      label: t("nav.categories"),
      icon: FolderTree,
      active: pathname.includes("categories"),
    },
  ];

  const productDropdownRoutes = [
    {
      href: `/${params.storeId}/products`,
      label: t("nav.productsList"),
      icon: Package,
      active: pathname === `/${params.storeId}/products`,
      badge:
        newCounts.newProductsCount > 0 ? newCounts.newProductsCount : undefined,
    },
    {
      href: `/${params.storeId}/sizes`,
      label: t("nav.sizes"),
      icon: Ruler,
      active: pathname.includes("sizes"),
    },
    {
      href: `/${params.storeId}/colors`,
      label: t("nav.colors"),
      icon: Palette,
      active: pathname.includes("colors"),
    },
    {
      href: `/${params.storeId}/materials`,
      label: t("nav.materials"),
      icon: Layers,
      active: pathname.includes("materials"),
    },
    {
      href: `/${params.storeId}/coupons`,
      label: t("nav.coupons"),
      icon: Ticket,
      active: pathname.includes("coupons"),
    },
  ];

  // Dropdown cho Orders, Returns, Shipping
  const orderDropdownRoutes = [
    {
      href: `/${params.storeId}/orders`,
      label: t("nav.orders"),
      icon: ShoppingCart,
      active: pathname.includes("orders"),
    },
    {
      href: `/${params.storeId}/returns`,
      label: t("nav.returns"),
      icon: RotateCcw,
      active: pathname.includes("returns"),
    },
    {
      href: `/${params.storeId}/shipping`,
      label: t("nav.shipping"),
      icon: Truck,
      active: pathname.includes("shipping"),
    },
  ];

  // Dropdown cho Reviews, Blog và Reports
  const contentDropdownRoutes = [
    {
      href: `/${params.storeId}/reviews`,
      label: t("nav.reviews"),
      icon: Star,
      active: pathname.includes("reviews"),
    },
    {
      href: `/${params.storeId}/blog`,
      label: t("nav.blog"),
      icon: FileText,
      active: pathname.includes("blog"),
    },
    {
      href: `/${params.storeId}/reports`,
      label: t("nav.reports"),
      icon: BarChart3,
      active: pathname.includes("reports"),
    },
  ];

  const settingsDropdownRoutes = params.storeId
    ? [
        {
          href: `/${params.storeId}/settings`,
          label: "Store Settings",
          icon: Settings,
          active:
            pathname.includes("settings") && !pathname.includes("profile"),
        },
        {
          href: `/${params.storeId}/profile`,
          label: "User Profile",
          icon: User,
          active: pathname.includes("profile"),
        },
      ]
    : [];

  const isSettingsDropdownActive = settingsDropdownRoutes.some(
    (route) => route.active
  );

  const isProductDropdownActive = productDropdownRoutes.some(
    (route) => route.active
  );
  const isOrderDropdownActive = orderDropdownRoutes.some(
    (route) => route.active
  );
  const isContentDropdownActive = contentDropdownRoutes.some(
    (route) => route.active
  );

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
      {routes.map((route) => {
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 relative",
              route.active
                ? "text-black dark:text-white font-semibold bg-white/40 dark:bg-white/10 shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {route.label}
            {route.badge && route.badge > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 min-w-5 px-1.5 text-xs flex items-center justify-center"
              >
                {route.badge > 99 ? "99+" : route.badge}
              </Badge>
            )}
          </Link>
        );
      })}

      {/* Products Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary outline-none px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10",
            isProductDropdownActive
              ? "text-black dark:text-white bg-white/40 dark:bg-white/10 shadow-sm"
              : "text-muted-foreground"
          )}
        >
          <Box className="h-4 w-4" />
          {t("nav.products")}
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${
              isProductDropdownActive ? "rotate-180" : ""
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
          {productDropdownRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <DropdownMenuItem key={route.href} asChild>
                <Link
                  href={route.href}
                  className={cn(
                    "flex items-center gap-2 w-full cursor-pointer rounded-md px-2 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10 relative",
                    route.active
                      ? "font-bold bg-primary/10 text-primary"
                      : "text-neutral-700 dark:text-neutral-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {route.label}
                  {route.badge && route.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-auto h-5 min-w-5 px-1.5 text-xs flex items-center justify-center"
                    >
                      {route.badge > 99 ? "99+" : route.badge}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Orders Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary outline-none px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10",
            isOrderDropdownActive
              ? "text-black dark:text-white bg-white/40 dark:bg-white/10 shadow-sm"
              : "text-muted-foreground"
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          {t("nav.orders")}
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${
              isOrderDropdownActive ? "rotate-180" : ""
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
          {orderDropdownRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <DropdownMenuItem key={route.href} asChild>
                <Link
                  href={route.href}
                  className={cn(
                    "flex items-center gap-2 w-full cursor-pointer rounded-md px-2 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
                    route.active
                      ? "font-bold bg-primary/10 text-primary"
                      : "text-neutral-700 dark:text-neutral-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {route.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Content Dropdown (Reviews & Blog) */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary outline-none px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10",
            isContentDropdownActive
              ? "text-black dark:text-white bg-white/40 dark:bg-white/10 shadow-sm"
              : "text-muted-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          {t("nav.content")}
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${
              isContentDropdownActive ? "rotate-180" : ""
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
          {contentDropdownRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <DropdownMenuItem key={route.href} asChild>
                <Link
                  href={route.href}
                  className={cn(
                    "flex items-center gap-2 w-full cursor-pointer rounded-md px-2 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
                    route.active
                      ? "font-bold bg-primary/10 text-primary"
                      : "text-neutral-700 dark:text-neutral-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {route.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary outline-none px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10",
            isSettingsDropdownActive
              ? "text-black dark:text-white bg-white/40 dark:bg-white/10 shadow-sm"
              : "text-muted-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          {t("nav.settings") || "Settings"}
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${
              isSettingsDropdownActive ? "rotate-180" : ""
            }`}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className={cn(
            "w-48 mt-2 p-1 z-50",
            glassEffect,
            "border-none ring-1 ring-black/5"
          )}
        >
          {settingsDropdownRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <DropdownMenuItem key={route.href} asChild>
                <Link
                  href={route.href}
                  className={cn(
                    "flex items-center gap-2 w-full cursor-pointer rounded-md px-2 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
                    route.active
                      ? "font-bold bg-primary/10 text-primary"
                      : "text-neutral-700 dark:text-neutral-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {route.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
