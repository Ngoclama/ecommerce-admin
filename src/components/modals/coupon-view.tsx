"use client";

import { useEffect, useState } from "react";
import axios from "axios";
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
  Ticket,
  Percent,
  DollarSign,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { formatter } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";

interface CouponViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponId: string | null;
  storeId: string;
}

interface Coupon {
  id: string;
  code: string;
  value: number;
  type: "PERCENT" | "FIXED";
  expiresAt: string | null;
  createdAt: string;
}

export const CouponViewModal: React.FC<CouponViewModalProps> = ({
  isOpen,
  onClose,
  couponId,
  storeId,
}) => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Coupon | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!couponId || !isOpen) return;

      try {
        setIsLoading(true);
        const response = await axios.get(`/api/${storeId}/coupons/${couponId}`);
        if (response.data) {
          setData(response.data as Coupon);
        }
      } catch (error) {
        console.error("Failed to fetch coupon details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [couponId, storeId, isOpen]);

  if (!isMounted) return null;

  // Kiểm tra tình trạng hết hạn
  const isExpired = data?.expiresAt && new Date(data.expiresAt) < new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md overflow-hidden bg-white dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>{t("modals.couponDetails")}</DialogTitle>
          <DialogDescription>{t("modals.couponDescription")}</DialogDescription>
        </DialogHeader>

        <Separator />

        {isLoading ? (
          <div className="flex h-40 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : data ? (
          <div className="space-y-6 pt-2">
            {}
            <div className="p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-neutral-900 rounded-md border shadow-sm">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
                    {t("modals.discountCode")}
                  </h3>
                  <p className="text-xl font-mono font-bold text-neutral-900 dark:text-neutral-100 tracking-wider">
                    {data.code}
                  </p>
                </div>
              </div>
              {isExpired ? (
                <Badge variant="destructive">{t("columns.expired")}</Badge>
              ) : (
                <Badge variant="default">{t("columns.active")}</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {}
              <div className="p-3 border rounded-md">
                <h3 className="text-xs font-medium text-neutral-500 mb-1 flex items-center gap-1">
                  {data.type === "PERCENT" ? (
                    <Percent className="h-3 w-3" />
                  ) : (
                    <DollarSign className="h-3 w-3" />
                  )}
                  {t("columns.value")}
                </h3>
                <div className="text-lg font-bold">
                  {data.type === "PERCENT"
                    ? `${data.value}%`
                    : formatter.format(data.value)}
                </div>
              </div>

              {}
              <div className="p-3 border rounded-md">
                <h3 className="text-xs font-medium text-neutral-500 mb-1">
                  Type
                </h3>
                <div className="text-sm font-medium">
                  {data.type === "PERCENT"
                    ? t("modals.percentage")
                    : t("modals.fixedAmount")}
                </div>
              </div>
            </div>

            {/* Expiration */}
            <div className="flex items-center gap-3 p-3 rounded-md border bg-neutral-50/50 dark:bg-neutral-800/30">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-xs font-medium text-neutral-500">
                  {t("modals.expirationDate")}
                </h3>
                <p className="text-sm font-medium">
                  {data.expiresAt
                    ? format(new Date(data.expiresAt), "PPP")
                    : t("modals.noExpirationDate")}
                </p>
              </div>
            </div>

            {}
            <div className="flex items-center justify-between text-xs text-neutral-500 border-t pt-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {t("modals.created")}{" "}
                  {data.createdAt
                    ? format(new Date(data.createdAt), "MMM do, yyyy")
                    : t("modals.unknown")}
                </span>
              </div>
              <div className="font-mono text-[10px]">ID: {data.id}</div>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-neutral-500">
            {t("modals.noDataFound")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
