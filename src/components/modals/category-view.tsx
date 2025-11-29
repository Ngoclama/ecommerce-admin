"use client";

import { useEffect, useState } from "react";
import { useCategory } from "@/hooks/use-api-cache";
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
  FolderTree,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/use-translation";

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
  parentId?: string | null;
  billboard?: {
    label: string;
  };
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export const CategoryViewModal: React.FC<CategoryViewModalProps> = ({
  isOpen,
  onClose,
  storeId,
  categoryId,
}) => {
  const { t } = useTranslation();
  // Chỉ fetch khi có categoryId hợp lệ (không phải "new" hoặc null)
  const isValidCategoryId = categoryId && categoryId !== "new";
  const {
    data,
    isLoading: loading,
    error,
  } = useCategory(storeId, isValidCategoryId ? categoryId : null);
  const categoryData = data as CategoryDetails | null;

  useEffect(() => {
    if (error && isValidCategoryId) {
      toast.error("Failed to load category details.");
      onClose();
    }
  }, [error, onClose, isValidCategoryId]);

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
          <DialogTitle>{t("modals.categoryDetails")}</DialogTitle>
          <DialogDescription>
            {t("modals.categoryDescription")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : categoryData ? (
          <div className="space-y-6">
            {/* Name & Basic Info */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1">
                <Tag className="h-4 w-4 opacity-70" /> {t("columns.name")}
              </Label>
              <Input
                disabled
                value={categoryData.name || ""}
                className="bg-neutral-100 dark:bg-neutral-800 border-none font-bold text-base"
              />
            </div>

            {/* SLUG */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1">
                <LinkIcon className="h-4 w-4 opacity-70" /> {t("columns.slug")}
              </Label>
              <code className="relative rounded bg-neutral-100 px-3 py-2 font-mono text-sm dark:bg-neutral-800 w-full border">
                {categoryData.slug || t("columns.na")}
              </code>
            </div>

            {/* Billboard */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1">
                <StoreIcon className="h-4 w-4 opacity-70" />{" "}
                {t("modals.linkedBillboard")}
              </Label>
              <div className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 text-sm font-medium border">
                {categoryData.billboard?.label ||
                  t("modals.noBillboardAssigned")}
              </div>
            </div>

            {/* Parent Category */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1">
                <FolderTree className="h-4 w-4 opacity-70" />{" "}
                {t("forms.category.parentCategory")}
              </Label>
              <div className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 text-sm font-medium border">
                {categoryData.parent ? (
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{categoryData.parent.name}</span>
                    <code className="text-xs text-neutral-500 dark:text-neutral-400">
                      {categoryData.parent.slug}
                    </code>
                  </div>
                ) : (
                  <span className="text-neutral-500 dark:text-neutral-400 italic">
                    {t("forms.category.noParent")}
                  </span>
                )}
              </div>
            </div>

            <Separator className="my-2" />

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {t("modals.createdAt")}
                </Label>
                <Input
                  disabled
                  value={formatDate(categoryData.createdAt)}
                  className="bg-neutral-100 dark:bg-neutral-800 border-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {t("modals.lastUpdated")}
                </Label>
                <Input
                  disabled
                  value={formatDate(categoryData.updatedAt)}
                  className="bg-neutral-100 dark:bg-neutral-800 border-none text-xs"
                />
              </div>
            </div>

            <Separator className="my-2" />

            {/* ID (Readonly) */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-xs text-neutral-400">
                {t("modals.systemId")}
              </Label>
              <code className="relative rounded bg-neutral-100 px-[0.3rem] py-[0.2rem] font-mono text-xs dark:bg-neutral-800 w-full border">
                {categoryData.id}
              </code>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-neutral-500">
            {t("modals.noDataFound")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
