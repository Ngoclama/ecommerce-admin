"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useBulkSizeModal } from '@/hooks/use-bulk-size-modal';

type Row = { name: string; value: string };

export const BulkCreateSizeModal = () => {
  const { isOpen, onClose } = useBulkSizeModal();
  const [rows, setRows] = useState<Row[]>([{ name: "", value: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => { if (!isOpen) setRows([{ name: "", value: "" }]); }, [isOpen]);

  const handleAddRow = () => setRows([...rows, { name: "", value: "" }]);
  const handleRemoveRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const handleChange = (i: number, field: keyof Row, val: string) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: val };
    setRows(updated);
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/${params.storeId}/sizes/bulk`, { rows });
      toast.success("Sizes created successfully!");
      router.refresh();
      onClose();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <DialogHeader><DialogTitle>Bulk Create Sizes</DialogTitle></DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-2">Name (e.g., XL)</th>
                <th className="p-2">Value (e.g., Extra Large)</th>
                <th className="p-2 w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {rows.map((row, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td className="p-2"><Input value={row.name} onChange={(e) => handleChange(i, "name", e.target.value)} placeholder="Name" /></td>
                    <td className="p-2"><Input value={row.value} onChange={(e) => handleChange(i, "value", e.target.value)} placeholder="Value" /></td>
                    <td className="p-2"><Button variant="destructive" size="sm" onClick={() => handleRemoveRow(i)}>X</Button></td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleAddRow}>+ Add Row</Button>
          <Button onClick={onSubmit} disabled={isLoading}>{isLoading ? "Saving..." : "Save All"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};