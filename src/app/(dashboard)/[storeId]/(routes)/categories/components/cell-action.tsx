"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Eye, Copy } from "lucide-react";
import { toast } from "sonner";
import { AlertModal } from "@/components/modals/alert-modal";
import { CategoryColumn } from "./columns";
import { CategoryViewModal } from "@/components/modals/category-view";
import { useTranslation } from "@/hooks/use-translation";

interface CellActionProps {
  data: CategoryColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [openAlert, setOpenAlert] = useState(false); // Modal xóa
  const [openView, setOpenView] = useState(false); // Modal xem

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Đã sao chép ID danh mục");
  };

  const handleEdit = () => {
    router.push(`/${params.storeId}/categories/${data.id}`);
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/${params.storeId}/categories/${data.id}`);

      toast.success("Đã xóa danh mục thành công");
      router.refresh();
    } catch (error) {
      toast.error(
        "Vui lòng xóa tất cả đơn hàng sử dụng danh mục này trước"
      );
    } finally {
      setIsLoading(false);
      setOpenAlert(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openAlert}
        onClose={() => setOpenAlert(false)}
        onConfirm={handleDelete}
        loading={isLoading}
      />

      {openView && (
        <CategoryViewModal
          isOpen={openView}
          onClose={() => setOpenView(false)}
          storeId={params.storeId as string}
          categoryId={data.id}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("columns.actions")}</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => onCopy(data.id)}>
            <Copy className="mr-2 h-4 w-4" />
            {t("actions.copyId")}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setOpenView(true)}>
            <Eye className="mr-2 h-4 w-4" />
            {t("actions.viewDetails")}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("actions.edit")}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setOpenAlert(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
