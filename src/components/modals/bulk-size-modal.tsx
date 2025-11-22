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
import { useBulkSizeModal } from "@/hooks/use-bulk-size-modal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Ruler,
  AlertCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Row = {
  name: string;
  value: string;
};

export const BulkCreateSizeModal: React.FC = () => {
  const { isOpen, onClose } = useBulkSizeModal();
  const [rows, setRows] = useState<Row[]>([{ name: "", value: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setRows([{ name: "", value: "" }]);
      }, 300);
    }
  }, [isOpen]);

  const handleAddRow = () => {
    setRows([...rows, { name: "", value: "" }]);
    setTimeout(() => {
      const element = document.getElementById("bulk-size-scroll-container");
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
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].name.trim()) {
        toast.error(`Row ${i + 1}: Name is required.`);
        return false;
      }
      if (!rows[i].value.trim()) {
        toast.error(`Row ${i + 1}: Value is required.`);
        return false;
      }
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await axios.post(`/api/${params.storeId}/sizes/bulk`, { rows });

      toast.success(`Successfully created ${rows.length} sizes!`);
      router.refresh();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data || "Failed to create sizes.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-neutral-900 overflow-hidden border-none shadow-2xl">
        <div className="px-6 py-5 border-b dark:border-neutral-800 bg-white dark:bg-neutral-900 z-20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Ruler className="w-6 h-6 text-primary" />
              </div>
              Bulk Create Sizes
            </DialogTitle>
            <DialogDescription className="text-neutral-500">
              Add multiple sizes (Name and Value) at once.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="bg-neutral-50/80 dark:bg-neutral-900/80 backdrop-blur-sm border-b dark:border-neutral-800 z-10 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          <div className="col-span-5">Name (Display)</div>
          <div className="col-span-5">Value (Code)</div>
          <div className="col-span-2 text-center">Action</div>
        </div>

        <div
          id="bulk-size-scroll-container"
          className="flex-1 overflow-y-auto p-6 bg-neutral-50/30 dark:bg-neutral-950/30 space-y-3"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {rows.map((row, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 grid grid-cols-12 gap-4 items-center"
              >
                {/* Name Input */}
                <div className="col-span-5">
                  <Input
                    disabled={isLoading}
                    placeholder="e.g., XL, Medium"
                    value={row.name}
                    onChange={(e) =>
                      handleChange(index, "name", e.target.value)
                    }
                    className={
                      !row.name && rows.length > 1
                        ? "border-red-300 focus-visible:ring-red-200 bg-red-50/50"
                        : "h-10"
                    }
                  />
                </div>

                {/* Value Input */}
                <div className="col-span-5">
                  <Input
                    disabled={isLoading}
                    placeholder="e.g., Extra Large, M"
                    value={row.value}
                    onChange={(e) =>
                      handleChange(index, "value", e.target.value)
                    }
                    className={
                      !row.value && rows.length > 1
                        ? "border-red-300 focus-visible:ring-red-200 bg-red-50/50"
                        : "h-10"
                    }
                  />
                </div>

                <div className="col-span-2 flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRow(index)}
                    disabled={rows.length === 1 || isLoading}
                    className="h-9 w-9 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-xs font-bold text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
                  {index + 1}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            layout
            onClick={handleAddRow}
            disabled={isLoading}
            className="w-full py-3 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-500 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Another Size
          </motion.button>
        </div>

        <div className="p-6 py-4 border-t dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center z-20">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="h-11 px-6 text-neutral-500 hover:text-neutral-900"
          >
            Cancel
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
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save ({rows.length}) Sizes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
