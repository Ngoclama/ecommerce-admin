"use client";

import axios from "axios";
import { useState } from "react";
import { Copy, MoreHorizontal, Truck, Eye, Trash } from "lucide-react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderColumn } from "./columns";
import { OrderViewModal } from "@/components/modals/order-view";
import { AlertModal } from "@/components/modals/alert-modal";
import { OrderFulfillmentModal } from "@/components/modals/order-fulfillment-modal";
import { useCreateShippingModal } from "@/hooks/use-create-shipping-modal";
import { useTranslation } from "@/hooks/use-translation";

interface CellActionProps {
  data: OrderColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { onOpen: onCreateShipping } = useCreateShippingModal();
  const [loading, setLoading] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Order ID copied to clipboard.");
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
      setOpenDelete(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
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
      <OrderFulfillmentModal
        isOpen={openUpdate}
        onClose={() => setOpenUpdate(false)}
        orderId={data.id}
        currentStatus={data.status}
        initialData={{
          shippingMethod: data.shippingMethod,
          trackingNumber: data.trackingNumber,
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("columns.actions")}</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => onCopy(data.id)}>
            <Copy className="mr-2 h-4 w-4" /> {t("actions.copyId")}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setOpenView(true)}>
            <Eye className="mr-2 h-4 w-4" /> {t("actions.viewDetails")}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setOpenUpdate(true)}>
            <Truck className="mr-2 h-4 w-4" /> {t("actions.update")}{" "}
            {t("columns.status")}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={async () => {
              try {
                const res = await axios.get(
                  `/api/${params.storeId}/orders/${data.id}`
                );
                onCreateShipping(data.id, res.data);
              } catch (error) {
                toast.error("Failed to load order details");
              }
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Truck className="mr-2 h-4 w-4" /> {t("nav.shipping")}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setOpenDelete(true)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" /> {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
