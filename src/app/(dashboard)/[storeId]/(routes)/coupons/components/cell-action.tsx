"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios"; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Eye, Copy } from "lucide-react";
import { toast } from "sonner";
import { AlertModal } from "@/components/modals/alert-modal";
import { CouponViewModal } from "@/components/modals/coupon-view";
import { CouponColumn } from "./columns";

interface CellActionProps {
  data: CouponColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [openAlert, setOpenAlert] = useState(false); // Modal xóa
  const [openView, setOpenView] = useState(false); // Modal xem

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Coupon ID copied to clipboard");
  };

  const handleEdit = () => {
    router.push(`/${params.storeId}/coupons/${data.id}`);
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/${params.storeId}/coupons/${data.id}`);

      toast.success("Coupon deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Make sure you removed all orders using this coupon first.");
    } finally {
      setIsLoading(false);
      setOpenAlert(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openAlert}
        onClose={() => setOpenAlert(false)}
        onConfirm={handleDelete}
        loading={isLoading}
      />

      {openView && (
        <CouponViewModal
          isOpen={openView}
          onClose={() => setOpenView(false)}
          storeId={params.storeId as string}
          couponId={data.id}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => onCopy(data.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy ID
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setOpenView(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem> 

          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setOpenAlert(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
