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

interface MaterialViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  materialId: string | null;
}

type MaterialDetails = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

export const MaterialViewModal: React.FC<MaterialViewModalProps> = ({
  isOpen,
  onClose,
  storeId,
  materialId,
}) => {
  const [data, setData] = useState<MaterialDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (isOpen && materialId && storeId) {
        try {
          setLoading(true);
          const response = await axios.get(`/api/${storeId}/materials/${materialId}`);
          if ("data" in response && typeof response.data === "object") {
            setData(response.data as MaterialDetails);
          }
        } catch (error) {
          toast.error("Failed to load material details.");
          onClose();
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isOpen, materialId, storeId, onClose]);

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
          <DialogTitle>Material Details</DialogTitle>
          <DialogDescription>
            Information about this material attribute.
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
