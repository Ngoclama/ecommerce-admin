"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Plus, Trash } from "lucide-react";
import { SizeColumn, columns } from "./columns";
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
import { SizeViewModal } from "@/components/modals/size-view ";

interface SizeClientProps {
  data: SizeColumn[];
}

export const SizeClient: React.FC<SizeClientProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/${params.storeId}/sizes`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete Sizes");
      toast.success("All Sizes deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete Sizes. Check related items first.");
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
        title="Delete All Sizes?"
        description="This action cannot be undone. All sizes will be permanently deleted."
      />

      <SizeViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        storeId={params.storeId as string}
        sizeId=""
      />

      <div className="flex items-center justify-between">
        <Heading
          title={`Sizes (${data.length})`}
          description="Manage sizes for your store"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Sizes Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push(`/${params.storeId}/sizes/new`)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4 " />
              Add New
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setDeleteAllOpen(true)}
              disabled={data.length === 0}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Trash className="h-4 w-4 text-red-500" />
              Delete All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator className="my-4" />

      <DataTable searchKey="name" columns={columns} data={data} />

      <Heading title="API" description="API Calls for sizes" />
      <Separator className="my-4" />
      <ApiList entityName="sizes" entityIdName="sizeId" />
    </>
  );
};
