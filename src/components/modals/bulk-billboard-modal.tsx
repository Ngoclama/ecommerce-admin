"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useBulkBillboardModal } from "@/hooks/use-bulk-billboard-modal";
import { motion, AnimatePresence } from "framer-motion";
import ImageUpload from "@/components/ui/image-upload";
import { Trash2, Plus, ImagePlus, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type Row = {
  label: string;
  imageUrl: string;
};

export const BulkCreateBillboardModal: React.FC = () => {
  const { isOpen, onClose } = useBulkBillboardModal();
  const [rows, setRows] = useState<Row[]>([{ label: "", imageUrl: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setRows([{ label: "", imageUrl: "" }]);
    }
  }, [isOpen]);

  const handleAddRow = () => {
    setRows([...rows, { label: "", imageUrl: "" }]);
  };

  const handleRemoveRow = (i: number) =>
    setRows(rows.filter((_, idx) => idx !== i));

  const handleChange = (i: number, field: keyof Row, value: string) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: value };
    setRows(updated);
  };

  const onSubmit = async () => {
    const invalidRows = rows.filter((r) => !r.label || !r.imageUrl);
    if (invalidRows.length > 0) {
      toast.error(
        `Please fill in all fields. (${invalidRows.length} incomplete rows)`
      );
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(`/api/${params.storeId}/billboards/bulk`, { rows });
      toast.success(`Successfully created ${rows.length} billboards!`);
      router.refresh();
      onClose();
    } catch (error) {
      toast.error("An error occurred while creating billboards.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[100vw] h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-neutral-900">
        <div className="p-6 pb-4 border-b dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ImagePlus className="w-6 h-6" />
              Bulk Create Billboards
            </DialogTitle>
            <DialogDescription>
              Add multiple billboards at once. Images must be under 4MB.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/50">
          <ScrollArea className="h-full w-full p-6">
            <div className="hidden md:grid grid-cols-12 gap-6 mb-4 px-4 font-medium text-sm text-neutral-500 uppercase tracking-wider">
              <div className="col-span-3">Image Preview</div>
              <div className="col-span-8">Label</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {rows.map((row, index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start md:items-center">
                      <div className="col-span-1 md:col-span-3">
                        <div className="relative">
                          <ImageUpload
                            value={row.imageUrl ? [row.imageUrl] : []}
                            disabled={isLoading}
                            onChange={(url) =>
                              handleChange(index, "imageUrl", url)
                            }
                            onRemove={() => handleChange(index, "imageUrl", "")}
                          />
                          {!row.imageUrl && (
                            <div className="absolute inset-0 -z-10 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-neutral-400">
                                No Image
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-8 space-y-2">
                        <label className="md:hidden text-sm font-medium">
                          Label
                        </label>
                        <Input
                          value={row.label}
                          disabled={isLoading}
                          onChange={(e) =>
                            handleChange(index, "label", e.target.value)
                          }
                          placeholder="e.g. Summer Sale 2024"
                          className="h-12 text-lg px-4 bg-transparent border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                        {!row.label && (
                          <div className="flex items-center gap-1 text-xs text-amber-500 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            <span>Label is required</span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-1 md:col-span-1 flex justify-center">
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

                    <div className="absolute -left-3 -top-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-neutral-200 dark:border-neutral-700 z-10">
                      {index + 1}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        <div className="p-6 pt-4 border-t dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={handleAddRow}
            disabled={isLoading}
            className="gap-2 h-12 px-6 text-base"
          >
            <Plus className="w-4 h-4" />
            Add Another Row
          </Button>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="h-12 px-6"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={onSubmit}
              disabled={isLoading}
              className="h-12 px-8 text-base font-semibold min-w-[150px]"
            >
              {isLoading ? "Creating..." : `Create (${rows.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
