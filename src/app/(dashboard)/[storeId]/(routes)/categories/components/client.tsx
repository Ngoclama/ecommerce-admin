"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Plus, Trash } from "lucide-react";
import { CategoryColumn, useCategoryColumns } from "./columns";
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

import { useBulkCategoryModal } from "@/hooks/use-bulk-category-modal";
import { useAlertModal } from "@/hooks/use-alert-modal";
import { AlertModal } from "@/components/modals/alert-modal";

interface CategoryClientProps {
  data: CategoryColumn[];
}

export const CategoryClient: React.FC<CategoryClientProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const columns = useCategoryColumns();
  const { onOpen: openBulkModal } = useBulkCategoryModal();
  const { onOpen: openAlert, onClose: closeAlert } = useAlertModal();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<CategoryColumn[]>([]);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      console.log("[CLIENT] Sending DELETE request...");

      const res = await fetch(`/api/${params.storeId}/categories`, {
        method: "DELETE",
      });

      console.log("[CLIENT] Response status:", res.status);
      const result = await res.json().catch(() => ({}));
      console.log("[CLIENT] Response body:", result);

      if (!res.ok)
        throw new Error(result.message || "Failed to delete categories");

      toast.success(result.message || "All categories deleted successfully!");
      router.refresh();
    } catch (error) {
      console.error("[CLIENT ERROR]", error);
      toast.error(
        "Unable to delete categories. Remove related products first."
      );
    } finally {
      setIsLoading(false);
      closeAlert();
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      toast.error(t("actions.noItemsSelected") || "No items selected");
      return;
    }

    try {
      setIsLoading(true);
      const categoryIds = selectedRows.map((row) => row.id);
      const response = await fetch(`/api/${params.storeId}/categories`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: categoryIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete categories");
      }

      const result = await response.json();
      toast.success(
        `${selectedRows.length} ${
          t("actions.deleteSelectedSuccess") ||
          "categories deleted successfully!"
        }`
      );
      setSelectedRows([]);
      router.refresh();
    } catch (error: any) {
      console.error("[DELETE_SELECTED_ERROR]", error);
      toast.error(
        error.message ||
          t("actions.deleteSelectedError") ||
          "Unable to delete selected categories. Remove related products first."
      );
    } finally {
      setIsLoading(false);
      setDeleteSelectedOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
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
          `Delete ${selectedRows.length} selected categories?`
        }
        description={
          t("actions.deleteSelectedDescription") ||
          "This action cannot be undone. Make sure you removed all related products first."
        }
      />
      <div
        className="
      bg-white/70 dark:bg-neutral-900/70 
      backdrop-blur-2xl 
      border border-neutral-200/60 dark:border-neutral-800/60 
      shadow-lg rounded-3xl 
      p-6 sm:p-8 
      transition-all
    "
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Heading
            title={`${t("nav.categories")} (${data.length})`}
            description={t("nav.categories")}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-xl bg-white/60 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 hover:bg-white/80 dark:hover:bg-neutral-700 transition-all cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
                {t("columns.actions")}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl bg-white/70 dark:bg-neutral-900/80 backdrop-blur-2xl border border-white/30 dark:border-neutral-800/60 p-1"
            >
              <DropdownMenuLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {t("nav.categories")} {t("columns.actions")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-neutral-200/40 dark:bg-neutral-700/40" />

              <DropdownMenuItem
                onClick={() => router.push(`/${params.storeId}/categories/new`)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
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
              <DropdownMenuSeparator className="bg-neutral-200/40 dark:bg-neutral-700/40" />
              <DropdownMenuItem
                disabled={data.length === 0 || isLoading}
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-2 cursor-pointer text-red-500"
              >
                <Trash className="h-4 w-4 text-red-500" />
                {t("actions.deleteAll")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Separator */}
        <Separator className="my-4" />

        {/* Table */}
        <DataTable
          searchKey="name"
          columns={columns}
          data={data}
          enableRowSelection={true}
          onRowSelectionChange={setSelectedRows}
        />

        {/* API Section */}
        <Separator className="my-8" />
        <Heading
          title="API"
          description="API endpoints for managing categories"
        />
        <Separator className="my-4" />
        <ApiList entityName="categories" entityIdName="categoryId" />
      </div>
    </>
  );
};
