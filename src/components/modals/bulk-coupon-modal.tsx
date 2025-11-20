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
import { useBulkCouponModal } from "@/hooks/use-bulk-coupon-modal";
import { motion, AnimatePresence } from "framer-motion";

type Row = {
  code: string;
  value: string;
  type: "PERCENT" | "FIXED";
};

export const BulkCreateCouponModal = () => {
  const { isOpen, onClose } = useBulkCouponModal();
  const [rows, setRows] = useState<Row[]>([
    { code: "", value: "", type: "PERCENT" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) setRows([{ code: "", value: "", type: "PERCENT" }]);
  }, [isOpen]);

  const handleAddRow = () => {
    setRows([...rows, { code: "", value: "", type: "PERCENT" }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Row, value: string) => {
    const newRows = [...rows];
    // @ts-ignore: gán dynamic field
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/${params.storeId}/coupons/bulk`, { rows });
      toast.success("Coupons created successfully!");
      router.refresh();
      onClose();
    } catch (error) {
      toast.error("Failed to create coupons. Check if codes already exist.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <DialogHeader>
          <DialogTitle>Bulk Create Coupons</DialogTitle>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto px-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-neutral-800">
                <th className="p-3 text-sm text-neutral-500 w-1/3">
                  Code (e.g., SALE50)
                </th>
                <th className="p-3 text-sm text-neutral-500 w-1/4">Value</th>
                <th className="p-3 text-sm text-neutral-500 w-1/4">Type</th>
                <th className="p-3 w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {rows.map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="group"
                  >
                    <td className="p-2">
                      <Input
                        placeholder="Code..."
                        value={row.code}
                        onChange={(e) =>
                          handleChange(index, "code", e.target.value)
                        }
                        className="bg-transparent"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        placeholder="Amount..."
                        value={row.value}
                        onChange={(e) =>
                          handleChange(index, "value", e.target.value)
                        }
                        className="bg-transparent"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        className="w-full p-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm"
                        value={row.type}
                        onChange={(e) =>
                          handleChange(index, "type", e.target.value)
                        }
                      >
                        <option value="PERCENT">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount ($)</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveRow(index)}
                        disabled={rows.length === 1}
                        className="h-8 w-8 opacity-100 "
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
            + Add Row
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Create Coupons"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
