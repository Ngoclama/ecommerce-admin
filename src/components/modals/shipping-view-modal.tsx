// Modal hiển thị chi tiết thông tin shipping order
// Có animation đẹp mắt và hiển thị đầy đủ thông tin: tracking, địa chỉ, phí vận chuyển, etc.

"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  User,
  Calendar,
  DollarSign,
  Truck,
  MapPin,
  Phone,
} from "lucide-react";
import { useShippingViewModal } from "@/hooks/use-shipping-view-modal";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { formatter } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";

export const ShippingViewModal = () => {
  const { t } = useTranslation();
  const { isOpen, onClose, shippingId } = useShippingViewModal();
  const params = useParams();
  const storeId = params.storeId as string;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch dữ liệu shipping order khi modal mở
  useEffect(() => {
    if (isOpen && shippingId) {
      setIsLoading(true);
      const fetchData = async () => {
        try {
          // Gọi API để lấy thông tin chi tiết shipping order
          const res = await axios.get(`/api/${storeId}/shipping/${shippingId}`);
          setData(res.data);
        } catch (error) {
          toast.error("Failed to load shipping details");
          onClose(); // Đóng modal nếu có lỗi
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, shippingId, storeId, onClose]);

  // Không render gì nếu modal không mở
  if (!isOpen) return null;

  // Map màu sắc cho từng trạng thái shipping
  // Mỗi trạng thái có màu riêng để dễ phân biệt
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    CREATED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    PICKED_UP: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    IN_TRANSIT: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    DELIVERED: "bg-green-500/10 text-green-500 border-green-500/20",
    RETURNED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  // Map màu sắc cho từng nhà vận chuyển
  const providerColors: Record<string, string> = {
    GHN: "bg-blue-500/10 text-blue-500",
    VIETTELPOST: "bg-green-500/10 text-green-500",
    GHTK: "bg-purple-500/10 text-purple-500",
    CUSTOM: "bg-gray-500/10 text-gray-500",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4"
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {t("modals.shippingDetails")}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white"></div>
                </div>
              ) : data ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-neutral-500">
                      {t("columns.status")}:
                    </span>
                    <Badge
                      className={
                        statusColors[data.status] || statusColors.PENDING
                      }
                    >
                      {data.status.replace("_", " ")}
                    </Badge>
                    <span className="text-sm font-medium text-neutral-500">
                      {t("columns.provider")}:
                    </span>
                    <Badge
                      className={
                        providerColors[data.provider] || providerColors.CUSTOM
                      }
                    >
                      {data.provider}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Package className="h-4 w-4" />
                        <span>{t("columns.trackingNumber")}</span>
                      </div>
                      <p className="font-mono text-sm font-semibold">
                        {data.trackingNumber}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Truck className="h-4 w-4" />
                        <span>{t("modals.orderDetails")} ID</span>
                      </div>
                      <p className="font-mono text-sm">{data.orderId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <h3 className="font-semibold">{t("modals.from")}</h3>
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold">{data.fromName}</p>
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <Phone className="h-3 w-3" />
                          <span>{data.fromPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <MapPin className="h-3 w-3" />
                          <span>{data.fromAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <h3 className="font-semibold">{t("modals.to")}</h3>
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold">{data.toName}</p>
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <Phone className="h-3 w-3" />
                          <span>{data.toPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <MapPin className="h-3 w-3" />
                          <span>{data.toAddress}</span>
                        </div>
                        {data.toCity && (
                          <p className="text-neutral-600 dark:text-neutral-400">
                            {data.toCity}
                            {data.toDistrict && `, ${data.toDistrict}`}
                            {data.toWard && `, ${data.toWard}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <DollarSign className="h-4 w-4" />
                        <span>{t("modals.shippingCost")}</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatter.format(data.shippingCost)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <span>{t("modals.shippingMethod")}</span>
                      </div>
                      <p className="font-semibold">
                        {data.shippingMethod || t("modals.standard")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t("modals.created")}{" "}
                      {new Date(data.createdAt).toLocaleDateString()}
                    </span>
                    {data.deliveredAt && (
                      <>
                        <span>•</span>
                        <span>
                          {t("modals.delivered")}{" "}
                          {new Date(data.deliveredAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {t("modals.shippingNotFound")}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
