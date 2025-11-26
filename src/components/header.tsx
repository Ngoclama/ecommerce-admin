"use client";

import {
  Search,
  Bell,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NavbarUser from "./navbar-user";
import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
import axios from "axios";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HeaderProps {
  stores: any[];
  onMenuClick?: () => void;
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
  className?: string;
}

interface NewItem {
  id: string;
  name?: string;
  label?: string;
  createdAt: Date | string;
}

interface NewItems {
  newProducts: NewItem[];
  newBillboards: NewItem[];
}

export function Header({
  stores,
  onMenuClick,
  onSidebarToggle,
  sidebarCollapsed = false,
  className,
}: HeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [newItems, setNewItems] = useState<NewItems>({
    newProducts: [],
    newBillboards: [],
  });
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetch new items khi mở dropdown
  useEffect(() => {
    if (notificationOpen && params.storeId) {
      const fetchNewItems = async () => {
        try {
          setLoadingNotifications(true);
          const res = await axios.get<NewItems>(
            `/api/${params.storeId}/stats/new-items`
          );
          setNewItems(res.data);
        } catch (error) {
          // Silent fail
        } finally {
          setLoadingNotifications(false);
        }
      };
      fetchNewItems();
    }
  }, [notificationOpen, params.storeId]);

  // Định nghĩa tất cả các route có thể tìm kiếm
  const searchRoutes = useMemo(
    () => [
      {
        href: `/${params.storeId}`,
        label: t("nav.overview"),
        keywords: ["dashboard", "overview", "home"],
      },
      {
        href: `/${params.storeId}/users`,
        label: t("nav.users"),
        keywords: ["users", "user", "customer"],
      },
      {
        href: `/${params.storeId}/billboards`,
        label: t("nav.billboards"),
        keywords: ["billboard", "banner", "ad"],
      },
      {
        href: `/${params.storeId}/categories`,
        label: t("nav.categories"),
        keywords: ["category", "categories"],
      },
      {
        href: `/${params.storeId}/products`,
        label: t("nav.productsList"),
        keywords: ["products", "product", "items"],
      },
      {
        href: `/${params.storeId}/sizes`,
        label: t("nav.sizes"),
        keywords: ["size", "sizes"],
      },
      {
        href: `/${params.storeId}/colors`,
        label: t("nav.colors"),
        keywords: ["color", "colors"],
      },
      {
        href: `/${params.storeId}/materials`,
        label: t("nav.materials"),
        keywords: ["material", "materials"],
      },
      {
        href: `/${params.storeId}/coupons`,
        label: t("nav.coupons"),
        keywords: ["coupon", "coupons", "discount", "promo"],
      },
      {
        href: `/${params.storeId}/orders`,
        label: t("nav.orders"),
        keywords: ["order", "orders"],
      },
      {
        href: `/${params.storeId}/returns`,
        label: t("nav.returns"),
        keywords: ["return", "returns", "refund"],
      },
      {
        href: `/${params.storeId}/shipping`,
        label: t("nav.shipping"),
        keywords: ["shipping", "delivery", "tracking"],
      },
      {
        href: `/${params.storeId}/reviews`,
        label: t("nav.reviews"),
        keywords: ["review", "reviews", "rating"],
      },
      {
        href: `/${params.storeId}/blog`,
        label: t("nav.blog"),
        keywords: ["blog", "post", "article"],
      },
      {
        href: `/${params.storeId}/reports`,
        label: t("nav.reports"),
        keywords: ["report", "reports", "analytics"],
      },
      {
        href: `/${params.storeId}/settings`,
        label: t("nav.settings"),
        keywords: ["settings", "setting", "config"],
      },
    ],
    [params.storeId, t]
  );

  const filteredRoutes = useMemo(() => {
    if (!searchQuery) return searchRoutes;
    const query = searchQuery.toLowerCase();
    return searchRoutes.filter(
      (route) =>
        route.label.toLowerCase().includes(query) ||
        route.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    );
  }, [searchQuery, searchRoutes]);

  const handleSelect = (href: string) => {
    router.push(href);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center gap-4 px-6 transition-all duration-300",
        "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl backdrop-saturate-150",
        "border-b border-white/20 dark:border-white/10",
        "shadow-sm shadow-black/5",
        className
      )}
    >
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar Toggle Button (Desktop) */}
      {onSidebarToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={onSidebarToggle}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <img
            src="/logo.png"
            alt="Logo"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 object-contain opacity-60"
          />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onFocus={() => setOpen(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 h-9 transition-all duration-200",
              "bg-white/50 dark:bg-gray-800/50",
              "border-white/30 dark:border-white/10",
              "backdrop-blur-sm",
              "focus:bg-white/80 dark:focus:bg-gray-800/80",
              "focus:border-primary/30"
            )}
          />
        </div>
      </div>

      {/* Command Dialog for Search */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("nav.overview")} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {filteredRoutes.map((route) => (
              <CommandItem
                key={route.href}
                onSelect={() => handleSelect(route.href)}
                className="cursor-pointer"
              >
                {route.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications Dropdown */}
        <DropdownMenu
          open={notificationOpen}
          onOpenChange={setNotificationOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-200"
            >
              <Bell className="h-5 w-5" />
              {(newItems.newProducts.length > 0 ||
                newItems.newBillboards.length > 0) && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn(
              "w-80 p-0 mt-2",
              "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl",
              "border border-white/20 dark:border-neutral-700/50 shadow-2xl"
            )}
          >
            <DropdownMenuLabel className="px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {t("nav.notifications") || "Notifications"}
                </span>
                {(newItems.newProducts.length > 0 ||
                  newItems.newBillboards.length > 0) && (
                  <span className="text-xs text-muted-foreground">
                    {newItems.newProducts.length +
                      newItems.newBillboards.length}{" "}
                    {t("nav.new") || "new"}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <ScrollArea className="h-[400px]">
              {loadingNotifications ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">
                    {t("common.loading") || "Loading..."}
                  </div>
                </div>
              ) : newItems.newProducts.length === 0 &&
                newItems.newBillboards.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">
                    {t("nav.noNotifications") || "No new items this month"}
                  </div>
                </div>
              ) : (
                <div className="p-2">
                  {/* New Products */}
                  {newItems.newProducts.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("nav.newProducts") || "New Products"} (
                        {newItems.newProducts.length})
                      </div>
                      {newItems.newProducts.map((product) => (
                        <DropdownMenuItem
                          key={product.id}
                          asChild
                          className="cursor-pointer px-3 py-2 rounded-lg"
                        >
                          <div
                            onClick={() => {
                              router.push(
                                `/${params.storeId}/products/${product.id}`
                              );
                              setNotificationOpen(false);
                            }}
                            className="flex items-center gap-3 w-full"
                          >
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {product.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(
                                  new Date(product.createdAt),
                                  "MMM d, yyyy"
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </DropdownMenuItem>
                      ))}
                      {newItems.newBillboards.length > 0 && (
                        <div className="my-2 border-t" />
                      )}
                    </>
                  )}

                  {/* New Billboards */}
                  {newItems.newBillboards.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("nav.newBillboards") || "New Billboards"} (
                        {newItems.newBillboards.length})
                      </div>
                      {newItems.newBillboards.map((billboard) => (
                        <DropdownMenuItem
                          key={billboard.id}
                          asChild
                          className="cursor-pointer px-3 py-2 rounded-lg"
                        >
                          <div
                            onClick={() => {
                              router.push(
                                `/${params.storeId}/billboards/${billboard.id}`
                              );
                              setNotificationOpen(false);
                            }}
                            className="flex items-center gap-3 w-full"
                          >
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <ImageIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {billboard.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(
                                  new Date(billboard.createdAt),
                                  "MMM d, yyyy"
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
            {(newItems.newProducts.length > 0 ||
              newItems.newBillboards.length > 0) && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-xs"
                    onClick={() => {
                      setNotificationOpen(false);
                      router.push(`/${params.storeId}`);
                    }}
                  >
                    {t("nav.viewAll") || "View All"}
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <NavbarUser items={stores} />
      </div>
    </header>
  );
}
