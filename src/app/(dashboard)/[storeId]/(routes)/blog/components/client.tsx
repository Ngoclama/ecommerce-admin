"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Trash } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";

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
import { BlogPostColumn, useBlogColumns } from "./columns";
import { useTranslation } from "@/hooks/use-translation";

interface BlogClientProps {
  data: BlogPostColumn[];
}

export const BlogClient: React.FC<BlogClientProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const columns = useBlogColumns();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<BlogPostColumn[]>([]);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/${params.storeId}/blog`);
      router.refresh();
      toast.success("Đã xóa tất cả bài viết blog thành công");
    } catch (error) {
      handleError(error, "Có lỗi xảy ra khi xóa bài viết.");
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
      const blogIds = selectedRows.map((row) => row.id);
      const response = await fetch(`/api/${params.storeId}/blog`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: blogIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete blog posts");
      }

      toast.success(
        `${selectedRows.length} ${
          t("actions.deleteSelectedSuccess") ||
          "blog posts deleted successfully!"
        }`
      );
      setSelectedRows([]);
      router.refresh();
    } catch (error: any) {
      handleError(
        error,
        t("actions.deleteSelectedError") ||
          "Không thể xóa bài viết đã chọn."
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
          `Delete ${selectedRows.length} selected blog posts?`
        }
        description={
          t("actions.deleteSelectedDescription") ||
          "This action cannot be undone."
        }
      />
      <div className="flex items-center justify-between">
        <Heading
          title={`${t("nav.blog")} (${data.length})`}
          description={t("nav.blog")}
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
              {t("nav.blog")} {t("columns.actions")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(`/${params.storeId}/blog/new`)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {t("actions.addNew")}
            </DropdownMenuItem>
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
      <DataTable
        searchKey="title"
        columns={columns}
        data={data}
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
      />
    </>
  );
};
