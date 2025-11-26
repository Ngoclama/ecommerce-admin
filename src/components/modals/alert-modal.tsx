"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  title?: string;
  description?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title,
  description,
}) => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    await onConfirm();
    // Tự động đóng modal sau khi confirm
    onClose();
  };

  const defaultTitle = t("modals.alert.title") || "Are you sure?";
  const defaultDescription =
    t("modals.alert.description") ||
    "This action cannot be undone. All related data will be lost.";

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent
        className={cn(
          "w-full max-w-sm rounded-2xl p-6 overflow-hidden",
          "backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80",
          "border border-white/20 dark:border-neutral-800 shadow-2xl"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600 dark:text-red-500">
            {title || defaultTitle}
          </DialogTitle>
          <DialogDescription className="text-neutral-600 dark:text-neutral-300">
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-6 space-x-2 flex items-center justify-end w-full">
          <Button
            disabled={loading}
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            {t("modals.alert.cancel") || t("actions.cancel") || "Cancel"}
          </Button>
          <Button
            disabled={loading}
            variant="destructive"
            onClick={handleConfirm}
            className="rounded-xl bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/30"
          >
            {loading
              ? t("modals.alert.processing") ||
                t("actions.processing") ||
                "Processing..."
              : t("modals.alert.confirm") || t("actions.confirm") || "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
