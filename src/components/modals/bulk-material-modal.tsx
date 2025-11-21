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
import { useBulkMaterialModal } from "@/hooks/use-bulk-material-modal";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash, Save } from "lucide-react"; // Import icons

type Row = {
  name: string;
  value: string;
};

export const BulkCreateMaterialModal = () => {
  const { isOpen, onClose } = useBulkMaterialModal();
  const [rows, setRows] = useState<Row[]>([{ name: "", value: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setRows([{ name: "", value: "" }]);
    }
  }, [isOpen]);

  const handleAddRow = () => {
    setRows([...rows, { name: "", value: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const handleChange = (index: number, field: keyof Row, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);

      const validRows = rows.filter(
        (row) => row.name.trim() !== "" && row.value.trim() !== ""
      );

      if (validRows.length === 0) {
        toast.error("Please enter at least one valid material.");
        return;
      }

      await axios.post(`/api/${params.storeId}/materials/bulk`, {
        rows: validRows,
      });
      toast.success(`Successfully created ${validRows.length} materials!`);
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle>Bulk Create Materials</DialogTitle>
          <DialogDescription>
            Add multiple materials at once. Example: Name: "Cotton", Value:
            "100% Organic Cotton".
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto px-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-neutral-800">
                <th className="p-3 text-sm font-medium text-neutral-500 w-[45%]">
                  Name (e.g. Cotton)
                </th>
                <th className="p-3 text-sm font-medium text-neutral-500 w-[45%]">
                  Value (e.g. 100% Cotton)
                </th>
                <th className="p-3 w-[10%] text-center"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {rows.map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group"
                  >
                    <td className="p-2">
                      <Input
                        disabled={isLoading}
                        placeholder="Material Name"
                        value={row.name}
                        onChange={(e) =>
                          handleChange(index, "name", e.target.value)
                        }
                        className="bg-transparent"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        disabled={isLoading}
                        placeholder="Material Value"
                        value={row.value}
                        onChange={(e) =>
                          handleChange(index, "value", e.target.value)
                        }
                        className="bg-transparent"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRow(index)}
                        disabled={rows.length === 1 || isLoading}
                        className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t dark:border-neutral-800">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddRow}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Another
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSubmit}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4" /> Save All
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
