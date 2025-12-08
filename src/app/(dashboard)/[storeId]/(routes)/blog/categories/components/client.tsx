"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Trash } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

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
import { BlogCategoryColumn, columns } from "./columns";

interface BlogCategoryClientProps {
  data: BlogCategoryColumn[];
}

export const BlogCategoryClient: React.FC<BlogCategoryClientProps> = ({
  data,
}) => {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      // Note: Need to implement DELETE all endpoint
      toast.success("Tính năng xóa tất cả sẽ sớm có mặt.");
    } catch (error) {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại sau");
    } finally {
      setIsLoading(false);
      setDeleteAllOpen(false);
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
      <div className="flex items-center justify-between">
        <Heading
          title={`Blog Categories (${data.length})`}
          description="Manage blog categories"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              router.push(`/${params.storeId}/blog/categories/new`)
            }
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
              <DropdownMenuLabel>Category Actions</DropdownMenuLabel>
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
      <DataTable searchKey="name" columns={columns} data={data} />
    </>
  );
};

