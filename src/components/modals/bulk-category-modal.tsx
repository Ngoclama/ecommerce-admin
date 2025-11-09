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
import { useBulkCategoryModal } from "@/hooks/use-bulk-category-modal";
import { motion, AnimatePresence } from "framer-motion";

type Billboard = {
  id: string;
  label: string;
};

type Row = {
  name: string;
  billboardId: string;
};

export const BulkCreateCategoryModal: React.FC = () => {
  const { isOpen, onClose } = useBulkCategoryModal();
  const [rows, setRows] = useState<Row[]>([{ name: "", billboardId: "" }]);
  const [billboards, setBillboards] = useState<Billboard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const fetchBillboards = async () => {
      try {
        const res = await axios.get<Billboard[]>(
          `/api/${params.storeId}/billboards`
        );
        setBillboards(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load billboards");
      }
    };
    fetchBillboards();
  }, [isOpen, params.storeId]);

  // Reset rows mỗi khi đóng modal
  useEffect(() => {
    if (!isOpen) setRows([{ name: "", billboardId: "" }]);
  }, [isOpen]);

  const handleAddRow = () => setRows([...rows, { name: "", billboardId: "" }]);
  const handleRemoveRow = (i: number) =>
    setRows(rows.filter((_, idx) => idx !== i));

  const handleChange = (i: number, field: keyof Row, value: string) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: value };
    setRows(updated);
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/${params.storeId}/categories/bulk`, { rows });
      toast.success("Categories created successfully!");
      router.refresh();
      onClose();
    } catch (error) {
      toast.error("An error occurred while creating categories.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl bg-white dark:bg-neutral-900 backdrop-blur-2xl 
                   border border-white dark:border-neutral-800 
                   shadow-[0_8px_40px_rgba(0,0,0,0.15)] rounded-3xl 
                   transition-all duration-300 overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-neutral-900 dark:text-neutral-50">
            Create Multiple Categories
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white dark:border-neutral-700/40">
          <motion.table
            className="min-w-full table-auto bg-white/50 dark:bg-neutral-900/50 
                       backdrop-blur-md border-collapse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <thead className="bg-white dark:bg-neutral-800/40">
              <tr className="text-left dark:text-neutral-300">
                <th className="px-4 py-3 w-1/2">Name</th>
                <th className="px-4 py-3 w-1/2">Billboard</th>
                <th className="px-4 py-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {rows.map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/20 dark:border-neutral-700/40"
                  >
                    <td className="px-4 py-2">
                      <Input
                        value={row.name}
                        onChange={(e) =>
                          handleChange(index, "name", e.target.value)
                        }
                        placeholder="Name..."
                        className="w-full bg-white dark:bg-neutral-800/50 border border-white/20 
                                   dark:border-neutral-700/40 rounded-xl text-neutral-800 
                                   dark:text-neutral-100 placeholder:text-neutral-400 
                                   focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </td>

                    <td className="px-4 py-2">
                      <select
                        className="border border-white/20 dark:border-neutral-700/40 
                                   bg-white/50 dark:bg-neutral-800/50 rounded-xl p-2 w-full 
                                   text-neutral-800 dark:text-neutral-100 focus:ring-2 
                                   focus:ring-blue-500 outline-none transition-all"
                        value={row.billboardId}
                        onChange={(e) =>
                          handleChange(index, "billboardId", e.target.value)
                        }
                      >
                        <option value="">-- Select Billboard --</option>
                        {billboards.map((bb) => (
                          <option key={bb.id} value={bb.id}>
                            {bb.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-2 text-center">
                      <Button
                        variant="destructive"
                        onClick={() => handleRemoveRow(index)}
                        disabled={rows.length === 1}
                        className="rounded-xl bg-red-500/80 hover:bg-red-600/90 
                                   dark:bg-red-600 dark:hover:bg-red-700 text-white 
                                   font-semibold text-sm px-3 py-1.5 transition-all"
                      >
                        Remove
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </motion.table>
        </div>

        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={handleAddRow}
            className="rounded-xl border border-neutral-300 dark:border-neutral-700 
                       bg-white/50 dark:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200 
                       hover:bg-white/30 dark:hover:bg-neutral-700/70 transition-all"
          >
            + Add Row
          </Button>

          <Button
            onClick={onSubmit}
            disabled={isLoading}
            variant={"outline"}
            className="rounded-xl text-black font-semibold px-6 shadow-lg shadow-blue-500/20 transition-all"
          >
            {isLoading ? "Processing..." : "Create All Categories"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
