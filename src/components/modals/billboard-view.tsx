"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/use-translation";

interface BillboardViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  billboardId: string | null;
  storeId: string;
}

interface Billboard {
  id: string;
  label: string;
  imageUrl: string;
  createdAt: string; 
}

export const BillboardViewModal: React.FC<BillboardViewModalProps> = ({
  isOpen,
  onClose,
  billboardId,
  storeId,
}) => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Billboard | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!billboardId || !isOpen) return;

      try {
        setIsLoading(true);
        const response = await axios.get(
          `/api/${storeId}/billboards/${billboardId}`
        );
        if (response.data) {
          setData(response.data as Billboard);
        }
      } catch (error) {
        console.error("Failed to fetch billboard details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [billboardId, storeId, isOpen]);

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-hidden bg-white dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>{t("modals.billboardDetails")}</DialogTitle>
          <DialogDescription>
            {t("modals.billboardDescription")}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {isLoading ? (
          <div className="flex h-60 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : data ? (
          <div className="grid gap-6 md:grid-cols-2 mt-4">
            <div className="space-y-6">
              {/* Label Section */}
              <div className="p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-800/50">
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  {t("columns.label")}
                </h3>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {data.label}
                </p>
              </div>

              {/* ID Section */}
              <div>
                <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">
                  {t("modals.billboardDetails")} ID
                </h3>
                <code className="text-xs font-mono text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded block w-fit">
                  {data.id}
                </code>
              </div>

              {}
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Calendar className="h-4 w-4" />
                <span>
                  {t("modals.createdOn")}{" "}
                  {data.createdAt
                    ? format(new Date(data.createdAt), "MMMM do, yyyy")
                    : t("modals.unknown")}
                </span>
              </div>
            </div>

            {/* Image Section */}
            <div className="aspect-video relative w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <Image
                fill
                src={data.imageUrl}
                alt={data.label}
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-neutral-500 flex-col gap-2">
            <p>{t("modals.noDataFound")}</p>
            <p className="text-xs text-muted-foreground">
              {t("modals.billboardDeleted")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
