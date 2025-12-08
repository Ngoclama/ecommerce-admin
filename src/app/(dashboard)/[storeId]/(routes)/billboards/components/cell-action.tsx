"use client";

import axios from "axios";
import { useState } from "react";
import { Copy, Edit, MoreHorizontal, Trash, Eye } from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertModal } from "@/components/modals/alert-modal";
import { BillboardColumn } from "./columns";
import { BillboardViewModal } from "@/components/modals/billboard-view";
import { useTranslation } from "@/hooks/use-translation";

interface CellActionProps {
  data: BillboardColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); 
  const [viewOpen, setViewOpen] = useState(false); 

  const onConfirm = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/billboards/${data.id}`);
      toast.success("Đã xóa billboard thành công");
      router.refresh();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Vui lòng xóa tất cả danh mục sử dụng billboard này trước";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Đã sao chép ID billboard");
  };

  return (
    <>
      {/* Alert Modal Xóa */}
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />

      {/* View Modal Xem Chi Tiết (Mới thêm) */}
      <BillboardViewModal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        billboardId={data.id}
        storeId={params.storeId as string}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("columns.actions")}</DropdownMenuLabel>

          {/* Copy ID */}
          <DropdownMenuItem onClick={() => onCopy(data.id)}>
            <Copy className="mr-2 h-4 w-4" />
            {t("actions.copyId")}
          </DropdownMenuItem>

          {/* Xem Chi Tiết  */}
          <DropdownMenuItem onClick={() => setViewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            {t("actions.viewDetails")}
          </DropdownMenuItem>

          {/* Sửa */}
          <DropdownMenuItem
            onClick={() =>
              router.push(`/${params.storeId}/billboards/${data.id}`)
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            {t("actions.update")}
          </DropdownMenuItem>

          {/* Xóa */}
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
