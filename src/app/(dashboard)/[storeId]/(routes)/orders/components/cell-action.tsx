"use client";

import axios from "axios";
import { useState } from "react";
import {
  Copy,
  MoreHorizontal,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderColumn } from "./columns";
import { OrderViewModal } from "@/components/modals/order-view";
import { AlertModal } from "@/components/modals/alert-modal";

interface CellActionProps {
  data: OrderColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [open, setOpen] = useState(false);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Order ID copied to clipboard.");
  };

  const onUpdateStatus = async (status: string) => {
    try {
      setLoading(true);
      await axios.patch(`/api/${params.storeId}/orders/${data.id}`, {
        status: status,
      });
      toast.success("Order status updated.");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/orders/${data.id}`);
      toast.success("Order deleted.");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      {openView && (
        <OrderViewModal
          isOpen={openView}
          onClose={() => setOpenView(false)}
          storeId={params.storeId as string}
          orderId={data.id}
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
            <Copy className="mr-2 h-4 w-4" /> Copy ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenView(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Package className="mr-2 h-4 w-4" /> Update Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onUpdateStatus("PENDING")}>
                <Clock className="mr-2 h-4 w-4" /> Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus("PROCESSING")}>
                <Package className="mr-2 h-4 w-4" /> Processing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus("SHIPPED")}>
                <Truck className="mr-2 h-4 w-4" /> Shipped
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus("DELIVERED")}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />{" "}
                Delivered
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus("CANCELLED")}>
                <XCircle className="mr-2 h-4 w-4 text-red-600" /> Cancelled
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <XCircle className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
