"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@/hooks/use-api-cache";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";
import { useParams } from "next/navigation";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-neutral-900">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle>{t("modals.userDetails")}</DialogTitle>
            <DialogDescription>{t("modals.userDescription")}</DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <p className="text-red-500 font-medium">
                {t("modals.failedToFetch") ||
                  "Không thể tải thông tin người dùng"}
              </p>
              <p className="text-sm text-gray-500">
                {error instanceof Error ? error.message : "Đã xảy ra lỗi"}
              </p>
            </div>
          ) : !user ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">
                {t("modals.notFound") || "Không tìm thấy người dùng"}
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              {/* Header Section - Avatar & Basic Info */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="shrink-0">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <Image
                      fill
                      src={user.imageUrl || "/placeholder-user.jpg"}
                      alt={user.name || user.email}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Basic Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-2xl font-light text-black dark:text-white uppercase tracking-wide">
                      {user.name ||
                        t("modals.anonymous") ||
                        "Người dùng ẩn danh"}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 font-light mt-1">
                      {user.email}
                    </p>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {user.isVIP && (
                      <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                        <Star className="w-3 h-3 mr-1" />
                        {t("columns.vip") || "VIP"}
                      </Badge>
                    )}
                    {user.isBanned ? (
                      <Badge variant="destructive">
                        <Ban className="w-3 h-3 mr-1" />
                        {t("columns.banned") || "Đã chặn"}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-green-500 text-white hover:bg-green-600"
                      >
                        {t("columns.active") || "Hoạt động"}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-black dark:text-white uppercase tracking-wide">
                    {t("modals.userInformation") || "Thông tin người dùng"}
                  </h3>

                  <div className="space-y-3">
                    {/* User ID */}
                    <div className="flex items-start gap-3">
                      <UserIcon className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                          {t("modals.userId") || "ID Người dùng"}
                        </p>
                        <p className="text-sm text-black dark:text-white font-mono break-all">
                          {user.id}
                        </p>
                      </div>
                    </div>

                    {/* Clerk ID */}
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                          Clerk ID
                        </p>
                        <p className="text-sm text-black dark:text-white font-mono break-all">
                          {user.clerkId}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                          {t("columns.email") || "Email"}
                        </p>
                        <p className="text-sm text-black dark:text-white break-all">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Phone */}
                    {user.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                            {t("columns.phone") || "Số điện thoại"}
                          </p>
                          <p className="text-sm text-black dark:text-white">
                            {user.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Role */}
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                          {t("columns.role") || "Vai trò"}
                        </p>
                        <p className="text-sm text-black dark:text-white">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Statistics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-black dark:text-white uppercase tracking-wide">
                    {t("modals.statistics") || "Thống kê"}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Stores */}
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Store className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                          {t("nav.stores") || "Cửa hàng"}
                        </p>
                      </div>
                      <p className="text-2xl font-light text-black dark:text-white">
                        {user._count.stores}
                      </p>
                    </div>

                    {/* Orders */}
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingBag className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                          {t("nav.orders") || "Đơn hàng"}
                        </p>
                      </div>
                      <p className="text-2xl font-light text-black dark:text-white">
                        {user._count.orders}
                      </p>
                    </div>

                    {/* Reviews */}
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                          {t("nav.reviews") || "Đánh giá"}
                        </p>
                      </div>
                      <p className="text-2xl font-light text-black dark:text-white">
                        {user._count.reviews}
                      </p>
                    </div>

                    {/* Addresses */}
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                          {t("modals.addresses") || "Địa chỉ"}
                        </p>
                      </div>
                      <p className="text-2xl font-light text-black dark:text-white">
                        {user._count.addresses}
                      </p>
                    </div>

                    {/* Wishlist */}
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                          {t("modals.wishlist") || "Yêu thích"}
                        </p>
                      </div>
                      <p className="text-2xl font-light text-black dark:text-white">
                        {user._count.wishlist}
                      </p>
                    </div>

                    {/* Returns */}
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <RotateCcw className="w-4 h-4 text-gray-500" />
                        <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                          {t("nav.returns") || "Đổi trả"}
                        </p>
                      </div>
                      <p className="text-2xl font-light text-black dark:text-white">
                        {user._count.returns}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Recent Orders */}
              {user.orders && user.orders.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-light text-black dark:text-white uppercase tracking-wide">
                    {t("modals.recentOrders") || "Đơn hàng gần đây"} (
                    {user.orders.length})
                  </h3>
                  <div className="space-y-3">
                    {user.orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-none bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <Package className="w-4 h-4 text-gray-500 shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-light text-black dark:text-white">
                                  {t("modals.orderCode") || "Mã đơn"}:{" "}
                                  <span className="font-mono">
                                    {order.id.slice(-8).toUpperCase()}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {format(
                                    new Date(order.createdAt),
                                    "dd/MM/yyyy HH:mm"
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Order Items */}
                            {order.orderItems &&
                              order.orderItems.length > 0 && (
                                <div className="ml-7 space-y-1">
                                  {order.orderItems.slice(0, 3).map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                                    >
                                      <span className="font-light">
                                        {item.productName ||
                                          item.product?.name ||
                                          "N/A"}{" "}
                                        x {item.quantity}
                                      </span>
                                    </div>
                                  ))}
                                  {order.orderItems.length > 3 && (
                                    <p className="text-xs text-gray-500 italic">
                                      +{order.orderItems.length - 3} sản phẩm
                                      khác
                                    </p>
                                  )}
                                </div>
                              )}

                            {/* Payment Status */}
                            <div className="ml-7 flex items-center gap-2 flex-wrap">
                              <Badge
                                variant={order.isPaid ? "default" : "secondary"}
                                className={
                                  order.isPaid
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-yellow-500 text-white hover:bg-yellow-600"
                                }
                              >
                                {order.isPaid
                                  ? t("columns.paid") || "Đã thanh toán"
                                  : t("modals.unpaid") || "CHƯA THANH TOÁN"}
                              </Badge>
                              {order.paymentMethod && (
                                <Badge variant="outline" className="text-xs">
                                  {order.paymentMethod}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm font-light text-black dark:text-white">
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: "VND",
                              }).format(order.total)}
                            </p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {order.status === "PENDING"
                                ? t("actions.pending")
                                : order.status === "PROCESSING"
                                ? t("actions.processingStatus")
                                : order.status === "SHIPPED"
                                ? t("actions.shipped")
                                : order.status === "DELIVERED"
                                ? t("actions.delivered")
                                : order.status === "CANCELLED"
                                ? t("actions.cancelled")
                                : order.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                      {t("modals.joinedDate") || "Ngày tham gia"}
                    </p>
                    <p className="text-sm text-black dark:text-white">
                      {format(new Date(user.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                      {t("modals.updated") || "Cập nhật lần cuối"}
                    </p>
                    <p className="text-sm text-black dark:text-white">
                      {format(new Date(user.updatedAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-light uppercase tracking-wide text-black dark:text-white border border-gray-300 dark:border-gray-600 rounded-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("modals.close") || "Đóng"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
