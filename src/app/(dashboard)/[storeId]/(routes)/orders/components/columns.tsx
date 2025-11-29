"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

export type OrderColumn = {
  id: string;
  phone: string;
  address: string;
  email: string | null;
  isPaid: boolean;
  totalPrice: string;
  products: string;
  createdAt: string;
  status: string;
  shippingMethod: string | null;
  trackingNumber: string | null;
  paymentMethod: string | null;
};

export const useOrderColumns = (): ColumnDef<OrderColumn>[] => {
  const { t } = useTranslation();

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "products",
      header: t("columns.products"),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">{row.original.products}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("columns.phone"),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.phone && row.original.phone !== ""
            ? row.original.phone
            : t("columns.na")}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: t("columns.email"),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.email || t("columns.na")}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: t("columns.address"),
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate text-sm">
          {row.original.address || t("columns.na")}
        </div>
      ),
    },
    {
      accessorKey: "totalPrice",
      header: t("columns.total"),
      cell: ({ row }) => (
        <div className="font-semibold">{row.original.totalPrice}</div>
      ),
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
      cell: ({ row }) => {
        const status = row.original.status;
        let variant: "default" | "secondary" | "destructive" | "outline" =
          "secondary";
        if (status === "SHIPPED" || status === "PROCESSING")
          variant = "default";
        if (status === "DELIVERED") variant = "default";
        if (status === "CANCELLED") variant = "destructive";

        const getStatusText = (status: string) => {
          switch (status?.toUpperCase()) {
            case "PENDING":
              return t("actions.pending");
            case "PROCESSING":
              return t("actions.processingStatus");
            case "SHIPPED":
              return t("actions.shipped");
            case "DELIVERED":
              return t("actions.delivered");
            case "CANCELLED":
              return t("actions.cancelled");
            default:
              return status;
          }
        };

        return (
          <Badge variant={variant} className="uppercase text-[10px]">
            {getStatusText(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isPaid",
      header: t("columns.paid"),
      cell: ({ row }) => {
        const { isPaid, paymentMethod, status } = row.original;

        // Logic: Nếu thanh toán trực tuyến thì đã thanh toán, còn COD thì chỉ khi đã giao
        let displayPaid = isPaid;
        if (paymentMethod === "COD") {
          // COD: chỉ đã thanh toán khi status là DELIVERED
          displayPaid = status === "DELIVERED";
        } else if (
          paymentMethod &&
          ["STRIPE", "MOMO", "VNPAY", "QR"].includes(paymentMethod)
        ) {
          // Thanh toán trực tuyến: luôn đã thanh toán
          displayPaid = true;
        }

        return (
          <Badge
            variant={displayPaid ? "default" : "destructive"}
            className={
              displayPaid ? "bg-green-500 hover:bg-green-600 text-white" : ""
            }
          >
            {displayPaid ? t("columns.yes") : t("columns.no")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "trackingNumber",
      header: t("columns.tracking"),
      cell: ({ row }) => (
        <div className="text-xs font-mono">
          {row.original.trackingNumber || t("columns.na")}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: t("columns.date"),
    },
    {
      id: "actions",
      cell: ({ row }) => <CellAction data={row.original} />,
    },
  ];
};

export const columns: ColumnDef<OrderColumn>[] = [];
