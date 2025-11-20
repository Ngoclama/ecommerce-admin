"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ColorViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  colorId: string | null;
}

type ColorDetails = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

export const ColorViewModal: React.FC<ColorViewModalProps> = ({
  isOpen,
  onClose,
  storeId,
  colorId,
}) => {
  const [data, setData] = useState<ColorDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (isOpen && colorId && storeId) {
        try {
          setLoading(true);
          const response = await axios.get(`/api/${storeId}/colors/${colorId}`);
          if ("data" in response && typeof response.data === "object") {
            setData(response.data as ColorDetails);
          }
        } catch (error) {
          toast.error("Failed to load color details.");
          onClose();
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isOpen, colorId, storeId, onClose]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle>Color Details</DialogTitle>
          <DialogDescription>
            Information about this color attribute.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label className="text-neutral-500 dark:text-neutral-400">
                  Name
                </Label>
                <div className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 text-sm font-medium">
                  {data.name}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label className="text-neutral-500 dark:text-neutral-400">
                  Value
                </Label>
                <div className="flex items-center gap-x-3">
                  <div className="flex-1 p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 text-sm font-medium">
                    {data.value}
                  </div>
                  <div
                    className="h-10 w-10 rounded-full border border-neutral-300 shadow-sm"
                    style={{ backgroundColor: data.value }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label className="text-neutral-500 dark:text-neutral-400">
                  Created At
                </Label>
                <Input
                  disabled
                  value={formatDate(data.createdAt)}
                  className="bg-neutral-100 dark:bg-neutral-800 border-none focus-visible:ring-0"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label className="text-neutral-500 dark:text-neutral-400">
                  Updated At
                </Label>
                <Input
                  disabled
                  value={formatDate(data.updatedAt)}
                  className="bg-neutral-100 dark:bg-neutral-800 border-none focus-visible:ring-0"
                />
              </div>
            </div>

            <Separator className="my-2" />

            <div className="grid grid-cols-1 gap-2">
              <Label className="text-xs text-neutral-400">System ID</Label>
              <div className="flex items-center gap-2">
                <code className="relative rounded bg-neutral-100 px-[0.3rem] py-[0.2rem] font-mono text-xs dark:bg-neutral-800 w-full">
                  {data.id}
                </code>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-neutral-500">
            No data found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
