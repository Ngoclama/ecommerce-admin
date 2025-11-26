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
import { Loader2, Calendar, Hash, Ruler } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/use-translation";

interface SizeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeId: string | null;
  storeId: string;
}

interface Size {
  id: string;
  name: string;
  value: string;
  createdAt: string;
}

export const SizeViewModal: React.FC<SizeViewModalProps> = ({
  isOpen,
  onClose,
  sizeId,
  storeId,
}) => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Size | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Chỉ fetch khi có sizeId hợp lệ (không phải "new" hoặc null)
      if (!sizeId || sizeId === "new" || !isOpen) return;

      try {
        setIsLoading(true);
        const response = await axios.get(
          `/api/${storeId}/sizes/${sizeId}`
        );
        if (response.data) {
          setData(response.data as Size);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch size details:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sizeId, storeId, isOpen]);

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md overflow-hidden bg-white dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>{t("modals.sizeDetails")}</DialogTitle>
          <DialogDescription>
            {t("modals.sizeDescription")}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {isLoading ? (
          <div className="flex h-40 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : data ? (
          <div className="space-y-6 pt-2">
            {/* Name Section */}
            <div className="p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-800/50 flex items-start gap-3">
                <div className="p-2 bg-white dark:bg-neutral-900 rounded-md border shadow-sm">
                    <Ruler className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        {t("columns.name")}
                    </h3>
                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {data.name}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Value */}
                <div>
                    <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1">
                        <Hash className="h-3 w-3" /> {t("columns.value")}
                    </h3>
                    <div className="text-sm text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded-md border">
                        {data.value}
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between text-xs text-neutral-500 border-t pt-4">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{t("modals.created")} {data.createdAt ? format(new Date(data.createdAt), "MMM do, yyyy") : t("modals.unknown")}</span>
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