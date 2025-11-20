"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Eye, Copy } from "lucide-react";
import { BillboardColumn } from "./columns";
import { da } from "zod/v4/locales";
import { ApiAlert } from "@/components/ui/api-alert";
import { toast } from "sonner";
import { AlertModal } from "@/components/modals/alert-modal";
import { BillboardViewModal } from "@/components/modals/billboard-view";

interface CellActionProps {
  data: BillboardColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const handleEdit = () => {
    router.push(`/${params.storeId}/billboards/${data.id}`);
  };

  const handleView = () => {
    setViewModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await fetch(`/api/${params.storeId}/billboards/${data.id}`, {
        method: "DELETE",
      });
      toast.success("Billboard deleted successfully");
      router.push(`/${params.storeId}/billboards`);
      router.refresh();
    } catch (error) {
      toast.error("Make sure you removed all products and categories first.");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };
  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Billboard copied to clipboard");
  };
  return (
    <>
      <AlertModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        loading={isLoading}
      />
      <BillboardViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        storeId={params.storeId as string}
        billboardId={data.id}
      />
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-neutral-500" />
          </Button>
        </DropdownMenuTrigger>

        <AnimatePresence>
          {open && (
            <DropdownMenuContent
              align="end"
              className="min-w-[150px] rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-lg p-1"
              asChild
            >
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <DropdownMenuItem
                  onClick={handleView}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Eye className="h-4 w-4 text-neutral-500" />
                  View
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setIsOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onCopy(data.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 text-white-600 dark:text-white-400 transition"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          )}
        </AnimatePresence>
      </DropdownMenu>
    </>
  );
};
