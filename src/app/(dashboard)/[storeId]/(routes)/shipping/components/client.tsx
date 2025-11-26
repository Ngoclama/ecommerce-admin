// Component chính để hiển thị danh sách shipping orders
// Có bảng dữ liệu với search, sort, và các action

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { MoreHorizontal, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { AlertModal } from "@/components/modals/alert-modal";
import { ShippingColumn, useShippingColumns } from "./columns";
import { useShippingViewModal } from "@/hooks/use-shipping-view-modal";
import { ShippingViewModal } from "@/components/modals/shipping-view-modal";
import { useTranslation } from "@/hooks/use-translation";

// Props nhận vào danh sách shipping orders
interface ShippingClientProps {
  data: ShippingColumn[];
}

export const ShippingClient: React.FC<ShippingClientProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { onOpen } = useShippingViewModal(); // Hook để mở modal xem chi tiết
  const { t } = useTranslation();
  const columns = useShippingColumns();
  const [isLoading, setIsLoading] = useState(false); // Trạng thái loading
  const [deleteAllOpen, setDeleteAllOpen] = useState(false); // Trạng thái mở modal xác nhận xóa tất cả
  const [selectedRows, setSelectedRows] = useState<ShippingColumn[]>([]);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  /**
   * Hàm xóa tất cả shipping orders
   */
  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/${params.storeId}/shipping`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to delete shipping orders"
        );
      }

      toast.success(
        t("actions.deleteAll") || "All shipping orders deleted successfully"
      );
      router.refresh();
    } catch (error: any) {
      console.error("[SHIPPING_DELETE_ALL_ERROR]", error);
      toast.error(error.message || "Failed to delete shipping orders.");
    } finally {
      setIsLoading(false);
      setDeleteAllOpen(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      toast.error(t("actions.noItemsSelected") || "No items selected");
      return;
    }

    try {
      setIsLoading(true);
      const shippingIds = selectedRows.map((row) => row.id);
      const response = await fetch(`/api/${params.storeId}/shipping`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: shippingIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to delete shipping orders"
        );
      }

      toast.success(
        `${selectedRows.length} ${
          t("actions.deleteSelectedSuccess") ||
          "shipping orders deleted successfully!"
        }`
      );
      setSelectedRows([]);
      router.refresh();
    } catch (error: any) {
      console.error("[DELETE_SELECTED_ERROR]", error);
      toast.error(
        error.message ||
          t("actions.deleteSelectedError") ||
          "Unable to delete selected shipping orders."
      );
    } finally {
      setIsLoading(false);
      setDeleteSelectedOpen(false);
    }
  };

  return (
    <>
      {/* Modal xác nhận xóa tất cả */}
      <AlertModal
        isOpen={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        onConfirm={handleDeleteAll}
        loading={isLoading}
      />
      <AlertModal
        isOpen={deleteSelectedOpen}
        onClose={() => setDeleteSelectedOpen(false)}
        onConfirm={handleDeleteSelected}
        loading={isLoading}
        title={
          t("actions.deleteSelectedConfirm") ||
          `Delete ${selectedRows.length} selected shipping orders?`
        }
        description={
          t("actions.deleteSelectedDescription") ||
          "This action cannot be undone."
        }
      />

      {/* Modal xem chi tiết shipping */}
      <ShippingViewModal />

      {/* Header với title và menu actions */}
      <div className="flex items-center justify-between">
        <Heading
          title={`${t("nav.shipping")} (${data.length})`}
          description={t("nav.shipping")}
        />

        {/* Menu dropdown với các action tổng thể */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4" />
              {t("columns.actions")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              {t("nav.shipping")} {t("columns.actions")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Xóa shipping orders đã chọn */}
            <DropdownMenuItem
              disabled={selectedRows.length === 0 || isLoading}
              onClick={() => setDeleteSelectedOpen(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Trash className="h-4 w-4 text-red-500" />
              {t("actions.deleteSelected") ||
                `Delete Selected (${selectedRows.length})`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Xóa tất cả shipping orders */}
            <DropdownMenuItem
              onClick={() => setDeleteAllOpen(true)}
              disabled={data.length === 0 || isLoading} // Disable nếu không có data hoặc đang loading
              className="flex items-center gap-2 cursor-pointer text-red-500"
            >
              <Trash className="h-4 w-4" />
              {t("actions.deleteAll")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator className="my-4" />

      {/* Bảng dữ liệu với search và sort */}
      {/* searchKey="trackingNumber" cho phép search theo mã vận đơn */}
      <DataTable
        searchKey="trackingNumber"
        columns={columns}
        data={data}
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
      />
    </>
  );
};
