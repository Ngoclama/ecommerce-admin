"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Plus, Trash } from "lucide-react";
import { CouponColumn, useCouponColumns } from "./columns";
import { useTranslation } from "@/hooks/use-translation";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertModal } from "@/components/modals/alert-modal";
import { useBulkCouponModal } from "@/hooks/use-bulk-coupon-modal";

interface CouponClientProps {
  data: CouponColumn[];
}

export const CouponClient: React.FC<CouponClientProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const columns = useCouponColumns();
  const { onOpen: openBulkModal } = useBulkCouponModal();

  const [isLoading, setIsLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<CouponColumn[]>([]);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/${params.storeId}/coupons`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete Coupons");
      toast.success("Đã xóa tất cả mã giảm giá thành công");
      router.refresh();
    } catch (error) {
      handleError(error, "Không thể xóa mã giảm giá. Vui lòng kiểm tra các mục liên quan trước.");
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
      const couponIds = selectedRows.map((row) => row.id);
      const response = await fetch(`/api/${params.storeId}/coupons`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: couponIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete coupons");
      }

      toast.success(
        `${selectedRows.length} ${
          t("actions.deleteSelectedSuccess") || "coupons deleted successfully!"
        }`
      );
      setSelectedRows([]);
      router.refresh();
    } catch (error: any) {
      handleError(
        error,
        t("actions.deleteSelectedError") ||
          "Không thể xóa mã giảm giá đã chọn. Vui lòng kiểm tra các mục liên quan trước."
      );
    } finally {
      setIsLoading(false);
      setDeleteSelectedOpen(false);
    }
  };

  return (
    <>
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
          `Delete ${selectedRows.length} selected coupons?`
        }
        description={
          t("actions.deleteSelectedDescription") ||
          "This action cannot be undone. Make sure you removed all related orders first."
        }
      />

      <div className="flex items-center justify-between">
        <Heading
          title={`${t("nav.coupons")} (${data.length})`}
          description={t("nav.coupons")}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4" />
              {t("columns.actions")}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              {t("nav.coupons")} {t("columns.actions")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push(`/${params.storeId}/coupons/new`)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4 " />
              {t("actions.addNew")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={openBulkModal}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {t("actions.addBulk")}
            </DropdownMenuItem>

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
            <DropdownMenuItem
              onClick={() => setDeleteAllOpen(true)}
              disabled={data.length === 0 || isLoading}
              className="flex items-center gap-2 cursor-pointer text-red-500"
            >
              <Trash className="h-4 w-4 text-red-500" />
              {t("actions.deleteAll")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator className="my-4" />

      <DataTable
        searchKey="code"
        columns={columns}
        data={data}
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
      />

      <Heading title="API" description="API Calls for coupons" />
      <Separator className="my-4" />
      <ApiList entityName="coupons" entityIdName="couponId" />
    </>
  );
};
