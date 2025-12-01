"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Trash } from "lucide-react";

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
import { FlashSaleColumn, columns } from "./columns";
import axios from "axios";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";

interface FlashSaleClientProps {
  data: FlashSaleColumn[];
}

export const FlashSaleClient: React.FC<FlashSaleClientProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<FlashSaleColumn[]>([]);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/${params.storeId}/flash-sales`);
      router.refresh();
      toast.success("All flash sales deleted successfully.");
    } catch (error) {
      handleError(error, "Có lỗi xảy ra khi xóa flash sale.");
    } finally {
      setIsLoading(false);
      setDeleteAllOpen(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      toast.error("No items selected");
      return;
    }

    try {
      setIsLoading(true);
      const flashSaleIds = selectedRows.map((row) => row.id);
      const response = await fetch(`/api/${params.storeId}/flash-sales`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: flashSaleIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete flash sales");
      }

      toast.success(`${selectedRows.length} flash sales deleted successfully!`);
      setSelectedRows([]);
      router.refresh();
    } catch (error: any) {
      handleError(error, "Không thể xóa flash sale đã chọn.");
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
        title={`Delete ${selectedRows.length} selected flash sales?`}
        description="This action cannot be undone."
      />
      <div className="flex items-center justify-between">
        <Heading
          title={`Flash Sales (${data.length})`}
          description="Manage flash sales and promotions"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push(`/${params.storeId}/flash-sales/new`)}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Flash Sale Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={selectedRows.length === 0 || isLoading}
                onClick={() => setDeleteSelectedOpen(true)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Trash className="h-4 w-4 text-red-500" />
                Delete Selected ({selectedRows.length})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteAllOpen(true)}
                disabled={data.length === 0 || isLoading}
                className="flex items-center gap-2 cursor-pointer text-red-500"
              >
                <Trash className="h-4 w-4" />
                Delete All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator className="my-4" />
      <DataTable
        searchKey="name"
        columns={columns}
        data={data}
        enableRowSelection={true}
        onRowSelectionChange={setSelectedRows}
      />
    </>
  );
};
