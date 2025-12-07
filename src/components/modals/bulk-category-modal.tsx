"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useBulkCategoryModal } from "@/hooks/use-bulk-category-modal";
import { useTranslation } from "@/hooks/use-translation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Tag,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageUpload from "@/components/ui/image-upload";

type Billboard = {
  id: string;
  label: string;
};

type Category = {
  id: string;
  name: string;
  parentId: string | null;
};

type Row = {
  name: string;
  billboardId: string;
  parentId: string | null;
  imageUrl: string;
};

export const BulkCreateCategoryModal: React.FC = () => {
  const { isOpen, onClose } = useBulkCategoryModal();
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([
    { name: "", billboardId: "", parentId: null, imageUrl: "" },
  ]);
  const [billboards, setBillboards] = useState<Billboard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBillboardsLoading, setIsBillboardsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  // Fetch Billboards và Categories khi mở modal
  useEffect(() => {
    if (isOpen) {
      const fetchBillboards = async () => {
        try {
          setIsBillboardsLoading(true);
          const res = await axios.get<Billboard[]>(
            `/api/${params.storeId}/billboards`
          );
          setBillboards(res.data);
        } catch (error) {
          console.error("Failed to fetch billboards:", error);
          toast.error("Không thể tải billboard. Vui lòng làm mới trang");
        } finally {
          setIsBillboardsLoading(false);
        }
      };

      const fetchCategories = async () => {
        try {
          setIsCategoriesLoading(true);
          const res = await axios.get<{ success: boolean; data: Category[] }>(
            `/api/${params.storeId}/categories`
          );
          if (res.data.success) {
            setCategories(res.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch categories:", error);
          // Don't show error toast for categories as it's optional
        } finally {
          setIsCategoriesLoading(false);
        }
      };

      fetchBillboards();
      fetchCategories();
    }
  }, [isOpen, params.storeId]);

  // Reset form khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setRows([{ name: "", billboardId: "", parentId: null, imageUrl: "" }]);
      }, 300);
    }
  }, [isOpen]);

  const handleAddRow = () => {
    setRows([
      ...rows,
      { name: "", billboardId: "", parentId: null, imageUrl: "" },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const handleChange = (
    index: number,
    field: keyof Row,
    value: string | null
  ) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const validateForm = () => {
    const invalidRows = rows.filter((r) => !r.name.trim() || !r.billboardId);
    if (invalidRows.length > 0) {
      const message = t("bulk.category.incompleteRows").replace(
        "{count}",
        invalidRows.length.toString()
      );
      toast.error(message);
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await axios.post(`/api/${params.storeId}/categories/bulk`, {
        rows: rows.map((r) => ({
          name: r.name,
          billboardId: r.billboardId,
          parentId: r.parentId || null,
          imageUrl: r.parentId ? "" : r.imageUrl, // Only include imageUrl for parent categories
        })),
      });

      const successMessage = t("bulk.category.createSuccess").replace(
        "{count}",
        rows.length.toString()
      );
      toast.success(successMessage);
      router.refresh();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data || "Something went wrong.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-full lg:max-w-[1400px] max-h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-neutral-900 overflow-hidden border-none shadow-2xl">
        {/* Header */}
        <div className="p-6 pb-4 border-b dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Tag className="w-6 h-6 text-primary" />
              {t("bulk.category.title")}
            </DialogTitle>
            <DialogDescription>
              {t("bulk.category.description")}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content - Scrollable Area */}
        <div className="flex-1 overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/50 relative">
          <ScrollArea className="h-full w-full p-6">
            {/* Table Header (Desktop only) */}
            <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_2.5fr_auto] gap-4 mb-4 px-4 font-medium text-sm text-neutral-500 uppercase tracking-wider">
              <div>{t("bulk.category.name")}</div>
              <div>{t("bulk.category.billboard")}</div>
              <div>{t("bulk.category.parentCategory")}</div>
              <div>{t("columns.image")}</div>
              <div className="text-center w-12">{t("columns.actions")}</div>
            </div>

            {/* Rows */}
            <div className="space-y-3 pb-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {rows.map((row, index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_2.5fr_auto] gap-4 items-start">
                      {/* Name Input */}
                      <div>
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          {t("bulk.category.name")}
                        </label>
                        <div className="relative">
                          <Input
                            disabled={isLoading}
                            placeholder={t("bulk.category.namePlaceholder")}
                            value={row.name}
                            onChange={(e) =>
                              handleChange(index, "name", e.target.value)
                            }
                            className={
                              !row.name && rows.length > 1
                                ? "border-amber-500/50 bg-amber-50/10"
                                : ""
                            }
                          />
                          {!row.name && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Billboard Select */}
                      <div>
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          {t("bulk.category.billboard")}
                        </label>
                        <Select
                          disabled={isLoading || isBillboardsLoading}
                          value={row.billboardId}
                          onValueChange={(value) =>
                            handleChange(index, "billboardId", value)
                          }
                        >
                          <SelectTrigger
                            className={
                              !row.billboardId && rows.length > 1
                                ? "border-amber-500/50 bg-amber-50/10"
                                : ""
                            }
                          >
                            <SelectValue
                              placeholder={
                                isBillboardsLoading
                                  ? t("common.loading")
                                  : t("bulk.category.billboardPlaceholder")
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {billboards.length === 0 && (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                {t("columns.na")}
                              </div>
                            )}
                            {billboards.map((billboard) => (
                              <SelectItem
                                key={billboard.id}
                                value={billboard.id}
                              >
                                {billboard.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Parent Category Select */}
                      <div>
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          {t("bulk.category.parentCategory")}
                        </label>
                        <Select
                          disabled={isLoading || isCategoriesLoading}
                          value={row.parentId || "__none__"}
                          onValueChange={(value) =>
                            handleChange(
                              index,
                              "parentId",
                              value === "__none__" ? null : value
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isCategoriesLoading
                                  ? t("common.loading")
                                  : t("bulk.category.parentCategoryPlaceholder")
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              {t("bulk.category.noParent")}
                            </SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Image Upload - Only for parent categories */}
                      <div>
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          {t("columns.image")}
                        </label>
                        {!row.parentId ? (
                          <ImageUpload
                            disabled={isLoading}
                            value={row.imageUrl ? [row.imageUrl] : []}
                            onChange={(urls) =>
                              handleChange(index, "imageUrl", urls[0] || "")
                            }
                            onRemove={() => handleChange(index, "imageUrl", "")}
                          />
                        ) : (
                          <div className="min-h-[100px] flex items-center justify-center text-xs text-muted-foreground italic bg-neutral-50 dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800">
                            {t("bulk.category.noImageForChild")}
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      <div className="flex justify-center items-start pt-8 md:pt-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(index)}
                          disabled={rows.length === 1 || isLoading}
                          className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors h-10 w-10 rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Row Number */}
                    <div className="absolute -left-2 -top-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-neutral-200 dark:border-neutral-700 z-10 shadow-sm">
                      {index + 1}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center gap-4 z-20">
          <Button
            variant="outline"
            onClick={handleAddRow}
            disabled={isLoading}
            className="gap-2 h-11 px-5 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("bulk.category.addRow")}
          </Button>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 px-5"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isLoading}
              className="h-11 px-8 text-sm font-semibold min-w-[140px] gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("forms.processing")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t("common.save")} ({rows.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
