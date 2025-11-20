"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useBulkColorModal } from "@/hooks/use-bulk-color-modal";
import { motion, AnimatePresence } from "framer-motion";

type Row = {
  name: string;
  value: string;
};

export const BulkCreateColorModal = () => {
  const { isOpen, onClose } = useBulkColorModal();
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
      await axios.post(`/api/${params.storeId}/colors/bulk`, { rows });
      toast.success("Colors created successfully!");
      router.refresh();
      onClose();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle>Bulk Create Colors</DialogTitle>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto px-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-neutral-800">
                <th className="p-3 text-sm font-medium text-neutral-500">
                  Name (e.g., Red)
                </th>
                <th className="p-3 text-sm font-medium text-neutral-500">
                  Value (Hex code)
                </th>
                <th className="p-3 w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {rows.map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="group"
                  >
                    <td className="p-2">
                      <Input
                        placeholder="Color Name"
                        value={row.name}
                        onChange={(e) =>
                          handleChange(index, "name", e.target.value)
                        }
                        className="bg-transparent"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-x-4">
                        <Input
                          placeholder="#000000"
                          value={row.value}
                          onChange={(e) =>
                            handleChange(index, "value", e.target.value)
                          }
                          className="bg-transparent"
                        />

                        <div className="relative w-10 h-10 rounded-full border shadow-sm border-neutral-200 overflow-hidden">
                          <div
                            className="absolute inset-0 w-full h-full"
                            style={{ backgroundColor: row.value }}
                          />
                          <input
                            type="color"
                            value={row.value || "#000000"}
                            onChange={(e) =>
                              handleChange(index, "value", e.target.value)
                            }
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer border-none p-0"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveRow(index)}
                        disabled={rows.length === 1}
                        className="h-8 w-8 opacity-100"
                      >
                        X
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t dark:border-neutral-800">
          <Button variant="outline" onClick={handleAddRow}>
            + Add Another Color
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Create All Colors"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
