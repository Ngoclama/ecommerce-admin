"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  FolderTree,
  ShoppingCart,
  Star,
  Settings,
  Package,
  Ruler,
  Palette,
  Layers,
  Ticket,
  RotateCcw,
  Truck,
  FileText,
  BarChart3,
  Box,
  ChevronRight,
  User,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store } from "@prisma/client";
import StoreSwitcher from "./store-switcher";

interface SidebarProps {
  className?: string;
  stores?: Store[];
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({
  className,
  stores = [],
  isOpen = true,
  onClose,
  collapsed = false,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { t } = useTranslation();

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
      icon: ImageIcon,
      active: pathname.includes("billboards"),
    },
    {
      href: `/${params.storeId}/categories`,
      label: t("nav.categories"),
      icon: FolderTree,
      active: pathname.includes("categories"),
    },
  ];

  const productMenu = {
    key: "products",
    label: t("nav.products"),
    icon: Box,
    items: [
      {
        href: `/${params.storeId}/products`,
        label: t("nav.productsList"),
        icon: Package,
        active: pathname === `/${params.storeId}/products`,
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
    ],
  };

  const orderMenu = {
    key: "orders",
    label: t("nav.orders"),
    icon: ShoppingCart,
    items: [
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
    ],
  };

  const contentMenu = {
    key: "content",
    label: t("nav.content"),
    icon: FileText,
    items: [
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
    ],
  };

  const settingsMenu = {
    key: "settings",
    label: t("nav.settings"),
    icon: Settings,
    items: [
      {
        href: `/${params.storeId}/settings`,
        label: "Store Settings",
        icon: Settings,
        active: pathname.includes("settings") && !pathname.includes("profile"),
      },
      {
        href: `/${params.storeId}/profile`,
        label: "User Profile",
        icon: User,
        active: pathname.includes("profile"),
      },
    ],
  };

  // Tự động mở rộng menu có item đang active
  const getInitialExpandedMenus = () => {
    const expanded: string[] = [];
    if (productMenu.items.some((item) => item.active))
      expanded.push(productMenu.key);
    if (orderMenu.items.some((item) => item.active))
      expanded.push(orderMenu.key);
    if (contentMenu.items.some((item) => item.active))
      expanded.push(contentMenu.key);
    if (settingsMenu.items.some((item) => item.active))
      expanded.push(settingsMenu.key);
    return expanded;
  };

  const [expandedMenus, setExpandedMenus] = useState<string[]>(
    getInitialExpandedMenus()
  );

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuKey)
        ? prev.filter((key) => key !== menuKey)
        : [...prev, menuKey]
    );
  };

  const isMenuExpanded = (menuKey: string) => expandedMenus.includes(menuKey);
  const isMenuActive = (menu: typeof productMenu) =>
    menu.items.some((item) => item.active);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r transition-all duration-300",
          "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl backdrop-saturate-150",
          "border-white/20 dark:border-white/10",
          "shadow-2xl shadow-black/5",
          collapsed ? "w-20" : "w-64",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {}
          <div
            className={cn(
              "flex h-16 items-center border-b border-white/20 dark:border-white/10 px-6",
              collapsed && "justify-center"
            )}
          >
            {!collapsed ? (
              <div className="w-full">
                <StoreSwitcher items={stores} />
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="relative h-8 w-8">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-1">
              {}
              {routes.map((route, index) => {
                const Icon = route.icon;
                return (
                  <motion.div
                    key={route.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={route.href}
                      title={collapsed ? route.label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                        "hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-sm",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        route.active
                          ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                          : "text-gray-700 dark:text-gray-300",
                        collapsed && "justify-center"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          {route.label}
                        </motion.span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Products Menu */}
              <div>
                <button
                  onClick={() => toggleMenu(productMenu.key)}
                  title={collapsed ? productMenu.label : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-white/50 dark:hover:bg-white/10",
                    isMenuActive(productMenu)
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-gray-700 dark:text-gray-300",
                    collapsed && "justify-center"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Box className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{productMenu.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform shrink-0",
                        isMenuExpanded(productMenu.key) && "rotate-90"
                      )}
                    />
                  )}
                </button>
                {!collapsed && isMenuExpanded(productMenu.key) && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-white/20 dark:border-white/10 pl-4">
                    {productMenu.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                            "hover:bg-white/50 dark:hover:bg-white/10",
                            item.active
                              ? "bg-primary/10 text-primary font-medium border border-primary/20"
                              : "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Orders Menu */}
              <div>
                <button
                  onClick={() => toggleMenu(orderMenu.key)}
                  title={collapsed ? orderMenu.label : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-white/50 dark:hover:bg-white/10",
                    isMenuActive(orderMenu)
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-gray-700 dark:text-gray-300",
                    collapsed && "justify-center"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{orderMenu.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform shrink-0",
                        isMenuExpanded(orderMenu.key) && "rotate-90"
                      )}
                    />
                  )}
                </button>
                {!collapsed && isMenuExpanded(orderMenu.key) && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-white/20 dark:border-white/10 pl-4">
                    {orderMenu.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                            "hover:bg-white/50 dark:hover:bg-white/10",
                            item.active
                              ? "bg-primary/10 text-primary font-medium border border-primary/20"
                              : "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Content Menu */}
              <div>
                <button
                  onClick={() => toggleMenu(contentMenu.key)}
                  title={collapsed ? contentMenu.label : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-white/50 dark:hover:bg-white/10",
                    isMenuActive(contentMenu)
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-gray-700 dark:text-gray-300",
                    collapsed && "justify-center"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{contentMenu.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform shrink-0",
                        isMenuExpanded(contentMenu.key) && "rotate-90"
                      )}
                    />
                  )}
                </button>
                {!collapsed && isMenuExpanded(contentMenu.key) && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-white/20 dark:border-white/10 pl-4">
                    {contentMenu.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                            "hover:bg-white/50 dark:hover:bg-white/10",
                            item.active
                              ? "bg-primary/10 text-primary font-medium border border-primary/20"
                              : "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {}
              <div>
                <button
                  onClick={() => toggleMenu(settingsMenu.key)}
                  title={collapsed ? settingsMenu.label : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "hover:bg-white/50 dark:hover:bg-white/10",
                    isMenuActive(settingsMenu)
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-gray-700 dark:text-gray-300",
                    collapsed && "justify-center"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{settingsMenu.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform shrink-0",
                        isMenuExpanded(settingsMenu.key) && "rotate-90"
                      )}
                    />
                  )}
                </button>
                {!collapsed && isMenuExpanded(settingsMenu.key) && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-white/20 dark:border-white/10 pl-4">
                    {settingsMenu.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                            "hover:bg-white/50 dark:hover:bg-white/10",
                            item.active
                              ? "bg-primary/10 text-primary font-medium border border-primary/20"
                              : "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
