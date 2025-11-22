"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Plus, Trash } from "lucide-react";
import { CouponColumn, columns } from "./columns";
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
  const { onOpen: openBulkModal } = useBulkCouponModal();

  const [isLoading, setIsLoading] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/${params.storeId}/coupons`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete Coupons");
      toast.success("All Coupons deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete Coupons. Check related items first.");
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
          title={`Coupons (${data.length})`}
          description="Manage coupons for your store"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Coupons Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push(`/${params.storeId}/coupons/new`)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4 " />
              Add New
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={openBulkModal}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Bulk
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

      <DataTable searchKey="code" columns={columns} data={data} />

      <Heading title="API" description="API Calls for coupons" />
      <Separator className="my-4" />
      <ApiList entityName="coupons" entityIdName="couponId" />
    </>
  );
};
