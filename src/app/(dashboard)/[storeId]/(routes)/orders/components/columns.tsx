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

        return (
          <Badge variant={variant} className="uppercase text-[10px]">
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isPaid",
      header: t("columns.paid"),
      cell: ({ row }) => (
        <Badge variant={row.original.isPaid ? "default" : "destructive"}>
          {row.original.isPaid ? t("columns.yes") : t("columns.no")}
        </Badge>
      ),
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
