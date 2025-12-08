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
import { useBulkBillboardModal } from "@/hooks/use-bulk-billboard-modal";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/ui/image-upload";
import {
  Trash2,
  Plus,
  ImagePlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

type Row = {
  label: string;
  imageUrl: string;
};

export const BulkCreateBillboardModal: React.FC = () => {
  const { isOpen, onClose } = useBulkBillboardModal();
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([{ label: "", imageUrl: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  // Reset form khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setRows([{ label: "", imageUrl: "" }]);
      }, 300);
    }
  }, [isOpen]);

  const handleAddRow = () => {
    setRows([...rows, { label: "", imageUrl: "" }]);
    // Tự động scroll xuống cuối
    setTimeout(() => {
      const element = document.getElementById(
        "bulk-billboard-scroll-container"
      );
      if (element) element.scrollTop = element.scrollHeight;
    }, 100);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Row, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const validateForm = () => {
    const invalidRows = rows.filter((r) => !r.label.trim() || !r.imageUrl);
    if (invalidRows.length > 0) {
      const message = t("bulk.billboard.incompleteRows").replace(
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
      await axios.post(`/api/${params.storeId}/billboards/bulk`, { rows });
      const successMessage = t("bulk.billboard.createSuccess").replace(
        "{count}",
        rows.length.toString()
      );
      toast.success(successMessage);
      router.refresh();
      onClose();
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      const errorMessage =
        error.response?.data || t("bulk.billboard.createError");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full lg:max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-neutral-900 overflow-hidden border-none shadow-2xl">
        {/* 1. Header Cố định */}
        <div className="px-6 py-5 border-b dark:border-neutral-800 bg-white dark:bg-neutral-900 z-20 flex justify-between items-start">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ImagePlus className="w-6 h-6 text-primary" />
              </div>
              {t("bulk.billboard.title")}
            </DialogTitle>
            <DialogDescription className="text-neutral-500">
              {t("bulk.billboard.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="hidden md:flex items-center gap-4 text-sm text-neutral-500 bg-neutral-50 dark:bg-neutral-800 px-4 py-2 rounded-full border">
            <div className="flex items-center gap-1">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {rows.length}
              </span>
              <span>{t("actions.items") || "Items"}</span>
            </div>
          </div>
        </div>

        {}
        <div className="bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b dark:border-neutral-800 z-10 px-6 py-3 grid grid-cols-12 gap-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          <div className="col-span-4">{t("bulk.billboard.image")}</div>
          <div className="col-span-7">{t("bulk.billboard.label")}</div>
          <div className="col-span-1 text-center"></div>
        </div>

        {/* 3. Scrollable Content */}
        <div
          id="bulk-billboard-scroll-container"
          className="flex-1 overflow-y-auto p-6 bg-neutral-50/30 dark:bg-neutral-950/30 space-y-3"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {rows.map((row, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
              >
                {}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 md:flex hidden h-6 w-6 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-xs font-bold text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index + 1}
                </div>

                {}
                <div className="col-span-1 md:col-span-4">
                  <div className="w-full min-h-[180px] flex flex-col justify-center bg-neutral-50 dark:bg-neutral-950/30 rounded-lg p-2 border border-dashed border-neutral-200 dark:border-neutral-800 relative">
                    <ImageUpload
                      value={row.imageUrl ? [row.imageUrl] : []}
                      disabled={isLoading}
                      onChange={(urls) => {
                        if (Array.isArray(urls) && urls.length > 0 && urls[0]) {
                          handleChange(index, "imageUrl", urls[0]);
                        }
                      }}
                      onRemove={() => handleChange(index, "imageUrl", "")}
                    />
                    {/* Cảnh báo thiếu ảnh */}
                    {!row.imageUrl && rows.length > 1 && (
                      <div className="absolute top-2 right-2 text-amber-500 animate-pulse pointer-events-none">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {}
                <div className="col-span-1 md:col-span-7 pt-2">
                  <div className="relative">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                      {t("bulk.billboard.label")}
                    </label>
                    <Input
                      value={row.label}
                      disabled={isLoading}
                      onChange={(e) =>
                        handleChange(index, "label", e.target.value)
                      }
                      placeholder={t("bulk.billboard.labelPlaceholder")}
                      className={`h-12 text-lg px-4 bg-transparent border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-primary/20 transition-all ${
                        !row.label && rows.length > 1
                          ? "border-amber-500/50 bg-amber-50/10"
                          : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Action */}
                <div className="col-span-1 md:col-span-1 flex justify-center pt-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRow(index)}
                    disabled={rows.length === 1 || isLoading}
                    className="h-10 w-10 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {}
          <motion.button
            layout
            onClick={handleAddRow}
            disabled={isLoading}
            className="w-full py-4 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-500 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium text-sm"
          >
            <Plus className="w-5 h-5" />
            {t("bulk.billboard.addRow")}
          </motion.button>
        </div>

        {/* 4. Footer Cố định */}
        <div className="p-6 py-4 border-t dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center z-20">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 px-6 text-neutral-500 hover:text-neutral-900"
          >
            {t("actions.cancel")}
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={onSubmit}
              disabled={isLoading}
              className="h-11 px-8 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("actions.processing")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t("actions.save")} ({rows.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
