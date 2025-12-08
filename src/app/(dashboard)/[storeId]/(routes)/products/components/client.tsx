"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { handleError } from "@/lib/error-handler";
import { MoreHorizontal, Plus, Trash, FileSpreadsheet } from "lucide-react";
import { ProductColumn, useProductColumns } from "./columns";
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
import { ProductViewModal } from "@/components/modals/product-view";

interface ProductClientProps {
  data: ProductColumn[];
}

export const ProductClient: React.FC<ProductClientProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const columns = useProductColumns();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<ProductColumn[]>([]);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/${params.storeId}/products`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete products");
      toast.success("Đã xóa tất cả sản phẩm thành công");
      router.refresh();
    } catch (error) {
      handleError(
        error,
        "Không thể xóa sản phẩm. Vui lòng kiểm tra các mục liên quan trước."
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
      const productIds = selectedRows.map((row) => row.id);
      const response = await fetch(`/api/${params.storeId}/products`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: productIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete products");
      }

      toast.success(
        `${selectedRows.length} ${t("actions.deleteSelectedSuccess") || "products deleted successfully!"}`
      );
      setSelectedRows([]);
      router.refresh();
    } catch (error: any) {
      handleError(
        error,
        t("actions.deleteSelectedError") ||
          "Không thể xóa sản phẩm đã chọn. Vui lòng kiểm tra các mục liên quan trước."
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
          `Delete ${selectedRows.length} selected products?`
        }
        description={
          t("actions.deleteSelectedDescription") ||
          "This action cannot be undone. Make sure you removed all related orders first."
        }
      />

      <ProductViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        storeId={params.storeId as string}
        productId=""
      />

      <div className="flex items-center justify-between">
        <Heading
          title={`${t("nav.products")} (${data.length})`}
          description={t("nav.products")}
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
              {t("nav.products")} {t("columns.actions")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push(`/${params.storeId}/products/new`)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4 " />
              {t("actions.addNew")}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push(`/${params.storeId}/products/import`)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Import CSV/Excel
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={selectedRows.length === 0 || isLoading}
              onClick={() => setDeleteSelectedOpen(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Trash className="h-4 w-4 text-red-500" />
              {t("actions.deleteSelected") || `Delete Selected (${selectedRows.length})`}
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
        searchKey="name"
        columns={columns}
        data={data}
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
      />

      <Heading title="API" description="API Calls for products" />
      <Separator className="my-4" />
      <ApiList entityName="products" entityIdName="productId" />
    </>
  );
};
