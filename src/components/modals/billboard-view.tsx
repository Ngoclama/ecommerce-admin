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
import { Loader2 } from "lucide-react";

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
}

export const BillboardViewModal: React.FC<BillboardViewModalProps> = ({
  isOpen,
  onClose,
  billboardId,
  storeId,
}) => {
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
        if ("data" in response && typeof response.data === "object") {
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
          <DialogTitle>Billboard Details</DialogTitle>
          <DialogDescription>
            View the details of your billboard.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {isLoading ? (
          <div className="flex h-60 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : data ? (
          <div className="grid gap-6 md:grid-cols-2 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  Label
                </h3>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
                  {data.label}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  ID
                </h3>
                <p className="text-sm font-mono text-neutral-600 dark:text-neutral-300 mt-1 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-md inline-block">
                  {data.id}
                </p>
              </div>
            </div>

            <div className="aspect-video relative w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
              <Image
                fill
                src={data.imageUrl}
                alt={data.label}
                className="object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-neutral-500">
            No data found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
