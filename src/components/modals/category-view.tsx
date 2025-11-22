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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  Tag,
  Link as LinkIcon,
  Store as StoreIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CategoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  categoryId: string | null;
}

type CategoryDetails = {
  id: string;
  name: string;
  slug: string; 
  billboardId: string;
  billboard?: {
    label: string;
  };
  createdAt: string;
  updatedAt: string;
};

export const CategoryViewModal: React.FC<CategoryViewModalProps> = ({
  isOpen,
  onClose,
  storeId,
  categoryId,
}) => {
  const [data, setData] = useState<CategoryDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (isOpen && categoryId && storeId) {
        try {
          setLoading(true);
          // Đảm bảo API backend trả về cả billboard object (nếu cần)
          const response = await axios.get(
            `/api/${storeId}/categories/${categoryId}`
          );
          if (response.data) {
            setData(response.data as CategoryDetails);
          }
        } catch (error) {
          toast.error("Failed to load category details.");
          onClose();
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isOpen, categoryId, storeId]);

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
          <DialogTitle>Category Details</DialogTitle>
          <DialogDescription>
            View detailed information about this category.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Name & Basic Info */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1">
                <Tag className="h-4 w-4 opacity-70" /> Name
              </Label>
              <Input
                disabled
                value={data.name}
                className="bg-neutral-100 dark:bg-neutral-800 border-none font-bold text-base"
              />
            </div>

            {/* SLUG */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1">
                <LinkIcon className="h-4 w-4 opacity-70" /> Slug
              </Label>
              <code className="relative rounded bg-neutral-100 px-3 py-2 font-mono text-sm dark:bg-neutral-800 w-full border">
                {data.slug || "N/A"}
              </code>
            </div>

            {/* Billboard */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1">
                <StoreIcon className="h-4 w-4 opacity-70" /> Linked Billboard
              </Label>
              <div className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 text-sm font-medium border">
                {data.billboard?.label || "No Billboard Assigned"}
              </div>
            </div>

            <Separator className="my-2" />

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Created At
                </Label>
                <Input
                  disabled
                  value={formatDate(data.createdAt)}
                  className="bg-neutral-100 dark:bg-neutral-800 border-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Last Updated
                </Label>
                <Input
                  disabled
                  value={formatDate(data.updatedAt)}
                  className="bg-neutral-100 dark:bg-neutral-800 border-none text-xs"
                />
              </div>
            </div>

            <Separator className="my-2" />

            {/* ID (Readonly) */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-xs text-neutral-400">System ID</Label>
              <code className="relative rounded bg-neutral-100 px-[0.3rem] py-[0.2rem] font-mono text-xs dark:bg-neutral-800 w-full border">
                {data.id}
              </code>
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
