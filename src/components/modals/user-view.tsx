"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@/hooks/use-api-cache";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Calendar,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Star,
  Ban,
  ShoppingBag,
  Store,
  MessageSquare,
  MapPin,
  Heart,
  RotateCcw,
  Package,
  TrendingUp,
  DollarSign,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Crown,
  Award,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatter } from "@/lib/utils";

interface UserViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: string;
  isVIP: boolean;
  isBanned: boolean;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    stores: number;
    orders: number;
    reviews: number;
    addresses: number;
    wishlist: number;
    returns: number;
  };
  orders: Array<{
    id: string;
    total: number;
    status: string;
    isPaid: boolean;
    paymentMethod: string | null;
    createdAt: string;
    orderItems: Array<{
      id: string;
      productName: string;
      quantity: number;
      price: number;
      product: {
        id: string;
        name: string;
        images: Array<{
          url: string;
        }>;
      } | null;
    }>;
  }>;
}

export const UserViewModal: React.FC<UserViewModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const { t } = useTranslation();
  const params = useParams();
  const storeId = params.storeId as string;
  const [isMounted, setIsMounted] = useState(false);

  // Sử dụng React Query để cache
  const { data, isLoading, error, refetch } = useUser(storeId, userId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Refetch data khi modal mở và userId thay đổi
  useEffect(() => {
    if (isOpen && userId && storeId) {
      refetch();
    }
  }, [isOpen, userId, storeId, refetch]);

  const user = data as User | undefined;

  // Debug log để kiểm tra data
  useEffect(() => {
    if (user && isOpen) {
      console.log("[UserView] User data:", {
        userId: user.id,
        ordersCount: user.orders?.length || 0,
        orders: user.orders,
        _count: user._count,
      });
    }
  }, [user, isOpen]);

  if (!isMounted) return null;

  // Tính tổng số tiền đã mua
  const totalSpent = user?.orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const totalItemsPurchased = user?.orders?.reduce(
    (sum, order) => sum + (order.orderItems?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0),
    0
  ) || 0;

  // Tính số đơn hàng theo trạng thái
  const ordersByStatus = user?.orders?.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Chờ xử lý", icon: Clock, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950" };
      case "PROCESSING":
        return { label: "Đang xử lý", icon: Package, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950" };
      case "SHIPPED":
        return { label: "Đã gửi hàng", icon: Truck, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950" };
      case "DELIVERED":
        return { label: "Đã giao hàng", icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950" };
      case "CANCELLED":
        return { label: "Đã hủy", icon: XCircle, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950" };
      default:
        return { label: status, icon: Package, color: "text-gray-600", bgColor: "bg-gray-50 dark:bg-gray-950" };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none! w-screen! h-screen! m-0! rounded-none! flex flex-col overflow-hidden bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-500 inset-0! translate-x-0! translate-y-0!">
        <div className="p-6 md:p-8 border-b border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-neutral-50 to-white dark:from-neutral-950 dark:to-gray-900 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
              {t("modals.userDetails") || "Chi tiết người dùng"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full w-full">
          <div className="pr-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-neutral-400 mx-auto" />
                <p className="text-sm text-neutral-500 font-light uppercase tracking-wide">
                  Đang tải thông tin...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-4 p-8">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-lg font-light text-red-600 dark:text-red-400 uppercase tracking-wide">
                {t("modals.failedToFetch") || "Không thể tải thông tin người dùng"}
              </p>
              <p className="text-sm text-neutral-500 font-light">
                {error instanceof Error ? error.message : "Đã xảy ra lỗi"}
              </p>
            </div>
          ) : !user ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-neutral-500 font-light uppercase tracking-wide">
                {t("modals.notFound") || "Không tìm thấy người dùng"}
              </p>
            </div>
          ) : (
            <div className="p-6 md:p-8 space-y-8 pb-8">
              {/* Header Section - Luxury Style */}
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                {/* Avatar - Large & Elegant */}
                <div className="shrink-0 relative">
                  <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-sm overflow-hidden border-2 border-neutral-200 dark:border-neutral-800 shadow-lg">
                    <Image
                      fill
                      src={user.imageUrl || "/placeholder-user.jpg"}
                      alt={user.name || user.email}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {user.isVIP && (
                    <div className="absolute -top-2 -right-2">
                      <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1 space-y-4 min-w-0">
                  <div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-tight">
                      {user.name || t("modals.anonymous") || "Người dùng ẩn danh"}
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 font-light mt-2 text-base md:text-lg">
                      {user.email}
                    </p>
                  </div>

                  {/* Status Badges - Luxury Style */}
                  <div className="flex flex-wrap gap-3">
                    {user.isVIP && (
                      <Badge className="bg-linear-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 border-0 px-4 py-1.5 gap-1.5">
                        <Crown className="w-4 h-4" />
                        <span className="font-light uppercase tracking-wide">{t("columns.vip") || "VIP"}</span>
                      </Badge>
                    )}
                    {user.isBanned ? (
                      <Badge variant="destructive" className="px-4 py-1.5 gap-1.5 border-0">
                        <Ban className="w-4 h-4" />
                        <span className="font-light uppercase tracking-wide">{t("columns.banned") || "Đã chặn"}</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-linear-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 border-0 px-4 py-1.5 gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-light uppercase tracking-wide">{t("columns.active") || "Hoạt động"}</span>
                      </Badge>
                    )}
                    <Badge variant="outline" className="px-4 py-1.5 gap-1.5 border-2 border-neutral-300 dark:border-neutral-700">
                      <Shield className="w-4 h-4" />
                      <span className="font-light uppercase tracking-wide">{user.role}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="bg-neutral-200 dark:bg-neutral-800" />

              {/* Statistics Cards - Luxury Style */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Total Spent */}
                <div className="p-4 md:p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-gray-900 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-neutral-500" />
                    <p className="text-xs text-neutral-500 font-light uppercase tracking-wide">
                      Tổng chi tiêu
                    </p>
                  </div>
                  <p className="text-xl md:text-2xl font-light text-neutral-900 dark:text-neutral-100">
                    {formatter.format(totalSpent)}
                  </p>
                </div>

                {/* Total Orders */}
                <div className="p-4 md:p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-gray-900 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag className="w-5 h-5 text-neutral-500" />
                    <p className="text-xs text-neutral-500 font-light uppercase tracking-wide">
                      Đơn hàng
                    </p>
                  </div>
                  <p className="text-xl md:text-2xl font-light text-neutral-900 dark:text-neutral-100">
                    {user._count.orders}
                  </p>
                </div>

                {/* Total Items Purchased */}
                <div className="p-4 md:p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-gray-900 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-neutral-500" />
                    <p className="text-xs text-neutral-500 font-light uppercase tracking-wide">
                      Sản phẩm
                    </p>
                  </div>
                  <p className="text-xl md:text-2xl font-light text-neutral-900 dark:text-neutral-100">
                    {totalItemsPurchased}
                  </p>
                </div>

                {/* Reviews */}
                <div className="p-4 md:p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-gray-900 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-neutral-500" />
                    <p className="text-xs text-neutral-500 font-light uppercase tracking-wide">
                      Đánh giá
                    </p>
                  </div>
                  <p className="text-xl md:text-2xl font-light text-neutral-900 dark:text-neutral-100">
                    {user._count.reviews}
                  </p>
                </div>

                {/* Wishlist */}
                <div className="p-4 md:p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-gray-900 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-neutral-500" />
                    <p className="text-xs text-neutral-500 font-light uppercase tracking-wide">
                      Yêu thích
                    </p>
                  </div>
                  <p className="text-xl md:text-2xl font-light text-neutral-900 dark:text-neutral-100">
                    {user._count.wishlist}
                  </p>
                </div>

                {/* Stores */}
                <div className="p-4 md:p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-gray-900 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <Store className="w-5 h-5 text-neutral-500" />
                    <p className="text-xs text-neutral-500 font-light uppercase tracking-wide">
                      Cửa hàng
                    </p>
                  </div>
                  <p className="text-xl md:text-2xl font-light text-neutral-900 dark:text-neutral-100">
                    {user._count.stores}
                  </p>
                </div>
              </div>

              <Separator className="bg-neutral-200 dark:bg-neutral-800" />

              {/* Tabs for organized information */}
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 h-12 bg-neutral-100 dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800">
                  <TabsTrigger value="info" className="text-xs font-light uppercase tracking-wide data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-950">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Thông tin
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs font-light uppercase tracking-wide data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-950">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Đơn hàng ({user.orders?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="text-xs font-light uppercase tracking-wide data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-950">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Thống kê
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs font-light uppercase tracking-wide data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-950 hidden lg:flex">
                    <Calendar className="w-4 h-4 mr-2" />
                    Hoạt động
                  </TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* User Information Card */}
                    <div className="p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-4">
                      <h3 className="text-lg font-light text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-4">
                        {t("modals.userInformation") || "Thông tin người dùng"}
                      </h3>
                      
                      <div className="space-y-4">
                        {/* User ID */}
                        <div className="flex items-start gap-3">
                          <UserIcon className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-500 font-light uppercase tracking-wide mb-1">
                              {t("modals.userId") || "ID Người dùng"}
                            </p>
                            <p className="text-sm text-neutral-900 dark:text-neutral-100 font-mono break-all">
                              {user.id}
                            </p>
                          </div>
                        </div>

                        {/* Clerk ID */}
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-500 font-light uppercase tracking-wide mb-1">
                              Clerk ID
                            </p>
                            <p className="text-sm text-neutral-900 dark:text-neutral-100 font-mono break-all">
                              {user.clerkId}
                            </p>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-500 font-light uppercase tracking-wide mb-1">
                              {t("columns.email") || "Email"}
                            </p>
                            <p className="text-sm text-neutral-900 dark:text-neutral-100 break-all">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Phone */}
                        {user.phone ? (
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-neutral-500 font-light uppercase tracking-wide mb-1">
                                {t("columns.phone") || "Số điện thoại"}
                              </p>
                              <p className="text-sm text-neutral-900 dark:text-neutral-100">
                                {user.phone}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-neutral-400 font-light uppercase tracking-wide mb-1">
                                {t("columns.phone") || "Số điện thoại"}
                              </p>
                              <p className="text-sm text-neutral-400 italic">
                                Chưa cập nhật
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Role */}
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-500 font-light uppercase tracking-wide mb-1">
                              {t("columns.role") || "Vai trò"}
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dates Card */}
                    <div className="p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-4">
                      <h3 className="text-lg font-light text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-4">
                        Thời gian
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-neutral-500 font-light uppercase tracking-wide mb-1">
                              {t("modals.joinedDate") || "Ngày tham gia"}
                            </p>
                            <p className="text-sm text-neutral-900 dark:text-neutral-100">
                              {format(new Date(user.createdAt), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-neutral-500 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-neutral-500 font-light uppercase tracking-wide mb-1">
                              {t("modals.updated") || "Cập nhật lần cuối"}
                            </p>
                            <p className="text-sm text-neutral-900 dark:text-neutral-100">
                              {format(new Date(user.updatedAt), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-6">
                  {user.orders && user.orders.length > 0 ? (
                    <div className="space-y-4">
                      {user.orders.map((order) => {
                        const statusInfo = getStatusInfo(order.status);
                        const StatusIcon = statusInfo.icon;
                        return (
                          <div
                            key={order.id}
                            className="p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div className="flex-1 space-y-4">
                                {/* Order Header */}
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Package className="w-5 h-5 text-neutral-500 shrink-0" />
                                  <div>
                                    <p className="text-sm font-light text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                                      Mã đơn: <span className="font-mono">{order.id.slice(-8).toUpperCase()}</span>
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                      {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                                    </p>
                                  </div>
                                  <Badge className={cn("gap-1.5", statusInfo.bgColor, statusInfo.color)}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {statusInfo.label}
                                  </Badge>
                                </div>

                                {/* Order Items */}
                                {order.orderItems && order.orderItems.length > 0 && (
                                  <div className="ml-8 space-y-3">
                                    {order.orderItems.map((item) => {
                                      const imageUrl = item.product?.images?.[0]?.url || "/placeholder.svg";
                                      return (
                                        <div key={item.id} className="flex items-center gap-3">
                                          <div className="relative w-16 h-16 shrink-0 border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                                            <Image
                                              src={imageUrl}
                                              alt={item.productName || item.product?.name || "Product"}
                                              fill
                                              className="object-cover"
                                              sizes="64px"
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-light text-neutral-900 dark:text-neutral-100 line-clamp-1">
                                              {item.productName || item.product?.name || "N/A"}
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                              Số lượng: {item.quantity} × {formatter.format(item.price)}
                                            </p>
                                          </div>
                                          <p className="text-sm font-light text-neutral-900 dark:text-neutral-100 shrink-0">
                                            {formatter.format(item.price * item.quantity)}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Payment Status */}
                                <div className="ml-8 flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant={order.isPaid ? "default" : "secondary"}
                                    className={cn(
                                      "gap-1.5",
                                      order.isPaid
                                        ? "bg-green-500 text-white hover:bg-green-600"
                                        : "bg-yellow-500 text-white hover:bg-yellow-600"
                                    )}
                                  >
                                    {order.isPaid ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Đã thanh toán
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3.5 h-3.5" />
                                        Chưa thanh toán
                                      </>
                                    )}
                                  </Badge>
                                  {order.paymentMethod && (
                                    <Badge variant="outline" className="gap-1.5">
                                      <CreditCard className="w-3.5 h-3.5" />
                                      {order.paymentMethod}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Order Total */}
                              <div className="text-right shrink-0">
                                <p className="text-2xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
                                  {formatter.format(order.total)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                      <p className="text-neutral-500 font-light uppercase tracking-wide">
                        Chưa có đơn hàng
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Order Status Breakdown */}
                    <div className="p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                      <h3 className="text-lg font-light text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-4">
                        Đơn hàng theo trạng thái
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(ordersByStatus).map(([status, count]) => {
                          const statusInfo = getStatusInfo(status);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <div key={status} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900">
                              <div className="flex items-center gap-3">
                                <StatusIcon className={cn("w-5 h-5", statusInfo.color)} />
                                <span className="text-sm font-light text-neutral-900 dark:text-neutral-100">
                                  {statusInfo.label}
                                </span>
                              </div>
                              <span className="text-lg font-light text-neutral-900 dark:text-neutral-100">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 space-y-4">
                      <h3 className="text-lg font-light text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-4">
                        Thống kê khác
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-neutral-500" />
                            <span className="text-sm font-light text-neutral-900 dark:text-neutral-100">
                              Địa chỉ
                            </span>
                          </div>
                          <span className="text-lg font-light text-neutral-900 dark:text-neutral-100">
                            {user._count.addresses}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900">
                          <div className="flex items-center gap-3">
                            <RotateCcw className="w-5 h-5 text-neutral-500" />
                            <span className="text-sm font-light text-neutral-900 dark:text-neutral-100">
                              Đổi trả
                            </span>
                          </div>
                          <span className="text-lg font-light text-neutral-900 dark:text-neutral-100">
                            {user._count.returns}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-6">
                  <div className="space-y-4">
                    <div className="p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                      <h3 className="text-lg font-light text-neutral-900 dark:text-neutral-100 uppercase tracking-wide mb-4">
                        Hoạt động gần đây
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900">
                          <Calendar className="w-5 h-5 text-neutral-500" />
                          <div className="flex-1">
                            <p className="text-sm font-light text-neutral-900 dark:text-neutral-100">
                              Tham gia hệ thống
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {format(new Date(user.createdAt), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                        {user.updatedAt && user.updatedAt !== user.createdAt && (
                          <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900">
                            <Calendar className="w-5 h-5 text-neutral-500" />
                            <div className="flex-1">
                              <p className="text-sm font-light text-neutral-900 dark:text-neutral-100">
                                Cập nhật lần cuối
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {format(new Date(user.updatedAt), "dd/MM/yyyy HH:mm")}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

            </div>
          )}
          </div>
          </ScrollArea>
        </div>

        <div className="p-6 md:p-8 pt-4 border-t border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-neutral-50 to-white dark:from-neutral-950 dark:to-gray-900 shrink-0">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-light uppercase tracking-wide text-neutral-900 dark:text-neutral-100 border-2 border-neutral-300 dark:border-neutral-700 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300"
            >
              {t("modals.close") || "Đóng"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
