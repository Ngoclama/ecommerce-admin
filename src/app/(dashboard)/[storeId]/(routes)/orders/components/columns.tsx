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

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "Chờ xử lý",
      PROCESSING: "Đang xử lý",
      SHIPPED: "Đang gửi", // giữ sát ý "ĐANG GỬI HÀNG" trên UI
      DELIVERED: "Đã giao",
      CANCELLED: "Đã hủy",
    };
    return map[status?.toUpperCase()] || status || t("columns.na");
  };

  const statusColors: Record<string, string> = {
    PENDING:
      "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    PROCESSING:
      "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    SHIPPED:
      "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
    DELIVERED:
      "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    CANCELLED:
      "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  };

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

        return (
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold uppercase ${
              statusColors[status?.toUpperCase()] ||
              "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            }`}
          >
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isPaid",
      header: t("columns.paid"),
      cell: ({ row }) => {
        const { isPaid, paymentMethod, status } = row.original;

        // Nếu thanh toán trực tuyến thì luôn đã thanh toán; COD chỉ khi đã giao
        let displayPaid = isPaid;
        if (paymentMethod === "COD") {
          displayPaid = status === "DELIVERED";
        } else if (
          paymentMethod &&
          ["STRIPE", "MOMO", "VNPAY", "QR"].includes(paymentMethod)
        ) {
          displayPaid = true;
        }

        return (
          <Badge
            variant="outline"
            className={
              displayPaid
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
                : "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
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
