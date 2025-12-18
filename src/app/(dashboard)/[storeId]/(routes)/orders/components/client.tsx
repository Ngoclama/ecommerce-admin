"use client";

import { useMemo, useState } from "react";
import { Trash, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertModal } from "@/components/modals/alert-modal";
import { CreateShippingModal } from "@/components/modals/create-shipping-modal";
import { OrderColumn, useOrderColumns } from "./columns";
import { useTranslation } from "@/hooks/use-translation";

interface OrderClientProps {
  data: OrderColumn[];
}

export const OrderClient: React.FC<OrderClientProps> = ({ data }) => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const columns = useOrderColumns();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<OrderColumn[]>([]);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  const statusParam =
    searchParams.get("status") || searchParams.get("statuses") || "";
  const activeStatuses = useMemo(
    () =>
      statusParam
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    [statusParam]
  );

  const statusOptions = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xử lý" },
    { key: "PROCESSING", label: "Đang xử lý" },
    { key: "SHIPPED", label: "Đã gửi hàng" },
    { key: "DELIVERED", label: "Đã giao hàng" },
    { key: "CANCELLED", label: "Đã hủy" },
    { key: "RETURNED", label: "Đã trả hàng" },
  ];

  const handleSelectStatus = (statusKey: string) => {
    const url = new URL(window.location.href);
    if (statusKey === "ALL") {
      url.searchParams.delete("status");
      url.searchParams.delete("statuses");
    } else {
      url.searchParams.set("status", statusKey);
    }
    router.replace(url.toString(), { scroll: false });
    router.refresh();
  };

  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/${params.storeId}/orders`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || t("actions.failedToDeleteOrders"));
      }

      const result = await res.json();
      toast.success(result.message || t("actions.allOrdersDeleted"));
      router.refresh();
    } catch (error: any) {
      handleError(
        error,
        t("actions.failedToDeleteOrders") || "Không thể xóa đơn hàng."
      );
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
      const orderIds = selectedRows.map((row) => row.id);
      const response = await fetch(`/api/${params.storeId}/orders`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: orderIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          errorData.error ||
          t("actions.failedToDeleteOrders");
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(
        `${selectedRows.length} ${
          t("actions.deleteSelectedSuccess") || "orders deleted successfully!"
        }`
      );
      setSelectedRows([]);
      router.refresh();
    } catch (error: any) {
      // Hiển thị message chi tiết từ error
      toast.error(
        error.message ||
          t("actions.unableToDeleteSelectedOrders") ||
          "Không thể xóa đơn hàng đã chọn.",
        {
          duration: 6000,
        }
      );
    } finally {
      setIsLoading(false);
      setDeleteSelectedOpen(false);
    }
  };

  return (
    <>
      <CreateShippingModal />
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
          `Delete ${selectedRows.length} selected orders?`
        }
        description={
          t("actions.deleteSelectedDescription") ||
          "This action cannot be undone. All related data will be lost."
        }
      />

      <div className="flex items-center justify-between">
        <Heading
          title={`${t("nav.orders")} (${data.length})`}
          description={t("nav.orders")}
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
              {t("nav.orders")} {t("columns.actions")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

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
              <Trash className="h-4 w-4" />
              {t("actions.deleteAll")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-wrap gap-2 mb-4">
        {statusOptions.map((option) => {
          const isActive =
            option.key === "ALL"
              ? activeStatuses.length === 0
              : activeStatuses.includes(option.key);
          return (
            <button
              key={option.key}
              onClick={() => handleSelectStatus(option.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                isActive
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                  : "border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-100 dark:hover:text-neutral-50"
              )}
            >
              {isActive && <CheckCircle2 className="h-4 w-4" />}
              <span className="whitespace-nowrap">{option.label}</span>
            </button>
          );
        })}
      </div>

      <DataTable
        searchKey="phone"
        columns={columns}
        data={data}
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
      />
    </>
  );
};
