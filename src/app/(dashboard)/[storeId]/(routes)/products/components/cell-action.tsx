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
import { ProductViewModal } from "@/components/modals/product-view";
import { ProductColumn } from "./columns";
import { useTranslation } from "@/hooks/use-translation";

interface CellActionProps {
  data: ProductColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [openView, setOpenView] = useState(false);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Product ID copied to clipboard");
  };

  const handleEdit = () => {
    router.push(`/${params.storeId}/products/${data.id}`);
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/${params.storeId}/products/${data.id}`);

      toast.success("Đã xóa sản phẩm thành công");
      router.refresh();
    } catch (error: any) {
      // Kiểm tra xem có phải lỗi từ server trả về không
      if (error.response?.data?.message) {
        toast.error(error.response.data.message, {
          duration: 6000,
        });
      } else {
        toast.error("Không thể xóa sản phẩm. Vui lòng thử lại sau.");
      }
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
        <ProductViewModal
          isOpen={openView}
          onClose={() => setOpenView(false)}
          storeId={params.storeId as string}
          productId={data.id}
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
