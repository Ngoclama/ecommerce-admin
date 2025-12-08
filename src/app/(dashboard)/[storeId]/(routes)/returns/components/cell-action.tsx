"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Copy, Edit, MoreHorizontal, Trash, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertModal } from "@/components/modals/alert-modal";
import { ReturnColumn } from "./columns";
import { useReturnViewModal } from "@/hooks/use-return-view-modal";
import { useTranslation } from "@/hooks/use-translation";

interface CellActionProps {
  data: ReturnColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { onOpen } = useReturnViewModal();
  const [loading, setLoading] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/returns/${data.id}`);
      router.refresh();
      toast.success("Đã xóa đơn trả hàng thành công");
    } catch (error) {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại sau");
    } finally {
      setLoading(false);
      setOpenAlert(false);
    }
  };

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Đã sao chép ID đơn trả hàng");
  };

  return (
    <>
      <AlertModal
        isOpen={openAlert}
        onClose={() => setOpenAlert(false)}
        onConfirm={onDelete}
        loading={loading}
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
          <DropdownMenuItem
            onClick={() => onOpen(data.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            {t("actions.view")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              router.push(`/${params.storeId}/returns/${data.id}`);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Edit className="h-4 w-4" />
            {t("actions.update")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onCopy(data.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Copy className="h-4 w-4" />
            {t("actions.copyId")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenAlert(true)}
            className="flex items-center gap-2 cursor-pointer text-red-500"
          >
            <Trash className="h-4 w-4" />
            {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
