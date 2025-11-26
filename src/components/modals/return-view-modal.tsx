"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, User, Calendar, DollarSign, FileText } from "lucide-react";
import { useReturnViewModal } from "@/hooks/use-return-view-modal";
import { useParams } from "next/navigation";
import { useReturn } from "@/hooks/use-api-cache";
import { toast } from "sonner";
import { formatter } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";

export const ReturnViewModal = () => {
  const { t } = useTranslation();
  const { isOpen, onClose, returnId } = useReturnViewModal();
  const params = useParams();
  const storeId = params.storeId as string;
  const { data, isLoading, error } = useReturn(storeId, returnId);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load return details");
      onClose();
    }
  }, [error, onClose]);

  if (!isOpen) return null;

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    APPROVED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
    PROCESSING: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
    CANCELLED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {t("modals.returnDetails")}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-white"></div>
                </div>
              ) : data ? (
                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-neutral-500">
                      {t("columns.status")}:
                    </span>
                    <Badge
                      className={
                        statusColors[data.status] || statusColors.PENDING
                      }
                    >
                      {data.status}
                    </Badge>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <User className="h-4 w-4" />
                        <span>{t("columns.customer")}</span>
                      </div>
                      <p className="font-semibold">
                        {data.user?.name || data.user?.email || "Anonymous"}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {data.user?.email}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Package className="h-4 w-4" />
                        <span>{t("modals.orderDetails")} ID</span>
                      </div>
                      <p className="font-mono text-sm">{data.orderId}</p>
                    </div>
                  </div>

                  {/* Return Reason */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <FileText className="h-4 w-4" />
                      <span>{t("columns.returnReason")}</span>
                    </div>
                    <p className="font-semibold">{data.reason}</p>
                    {data.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {data.description}
                      </p>
                    )}
                  </div>

                  {/* Refund Info */}
                  {data.refundAmount > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <DollarSign className="h-4 w-4" />
                          <span>{t("columns.refundAmount")}</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {formatter.format(data.refundAmount)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <span>{t("columns.refundMethod")}</span>
                        </div>
                        <p className="font-semibold">
                          {data.refundMethod || t("columns.na")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Return Items */}
                  {data.returnItems && data.returnItems.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        {t("modals.returnItems")}
                      </h3>
                      <div className="space-y-2">
                        {data.returnItems.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                          >
                            <p className="font-semibold">
                              {item.orderItem?.productName ||
                                t("columns.products")}
                            </p>
                            <p className="text-sm text-neutral-500">
                              {t("modals.quantity")}: {item.quantity}
                            </p>
                            {item.reason && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                                {t("modals.reason")} {item.reason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t("modals.created")}{" "}
                      {new Date(data.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  {t("modals.returnNotFound")}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
