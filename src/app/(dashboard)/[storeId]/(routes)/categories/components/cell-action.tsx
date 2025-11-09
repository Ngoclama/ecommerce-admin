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
import { CategoryColumn } from "./columns";
import { toast } from "sonner";
import { CategoryViewModal } from "@/components/modals/category-view";

interface CellActionProps {
  data: CategoryColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const handleEdit = () => {
    setMenuOpen(false);
    router.push(`/${params.storeId}/categories/${data.id}`);
  };

  const handleView = () => {
    setMenuOpen(false);
    setViewModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/${params.storeId}/categories/${data.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Category deleted successfully!");
      router.refresh();
    } catch (error) {
      toast.error("Please remove all products using this category first.");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Category ID copied!");
    setMenuOpen(false);
  };

  return (
    <>
      <CategoryViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        storeId={params.storeId as string}
        categoryId={data.id}
      />

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 rounded-xl hover:bg-white/60 dark:hover:bg-neutral-800/60 
                       backdrop-blur-md transition-all shadow-sm"
          >
            <MoreHorizontal className="h-4 w-4 text-neutral-500" />
          </Button>
        </DropdownMenuTrigger>

        <AnimatePresence>
          {menuOpen && (
            <DropdownMenuContent
              align="end"
              className="min-w-[170px] rounded-2xl bg-white/70 dark:bg-neutral-900/80 
                         backdrop-blur-2xl border border-white/30 dark:border-neutral-800/60 
                         shadow-[0_8px_40px_rgba(0,0,0,0.1)] p-1"
            >
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <DropdownMenuItem
                  onClick={handleView}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer 
                            dark:text-neutral-300 hover:bg-white/70 
                             dark:hover:bg-neutral-800 transition-all"
                >
                  <Eye className="h-4 w-4 text-neutral-500" />
                  View Details
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer 
                             text-blue-600 dark:text-blue-400 hover:bg-blue-50 
                             dark:hover:bg-blue-900/20 transition-all"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Category
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer 
             hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCopyId(data.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer 
                             dark:text-neutral-400 hover:bg-white/70 
                             dark:hover:bg-neutral-800 transition-all"
                >
                  <Copy className="h-4 w-4" />
                  Copy ID
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          )}
        </AnimatePresence>
      </DropdownMenu>
    </>
  );
};
