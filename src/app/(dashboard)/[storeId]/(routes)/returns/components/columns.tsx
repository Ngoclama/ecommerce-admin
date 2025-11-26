"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CellAction } from "./cell-action";
import { Badge } from "@/components/ui/badge";
import { formatter } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

export type ReturnColumn = {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  status: string;
  reason: string;
  refundAmount: number;
  refundMethod: string | null;
  createdAt: string;
};

export const useReturnColumns = (): ColumnDef<ReturnColumn>[] => {
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
      accessorKey: "orderNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.orderNumber")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
    },
    {
      accessorKey: "customerEmail",
      header: t("columns.email"),
    },
    {
      accessorKey: "status",
      header: t("columns.status"),
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-500/10 text-yellow-500",
        APPROVED: "bg-blue-500/10 text-blue-500",
        REJECTED: "bg-red-500/10 text-red-500",
        PROCESSING: "bg-purple-500/10 text-purple-500",
        COMPLETED: "bg-green-500/10 text-green-500",
        CANCELLED: "bg-gray-500/10 text-gray-500",
      };
      return (
        <Badge
          className={statusColors[status] || "bg-gray-500/10 text-gray-500"}
        >
          {status}
        </Badge>
      );
    },
  },
    {
      accessorKey: "reason",
      header: t("columns.returnReason"),
      cell: ({ row }) => {
        return (
          <div className="max-w-[200px] truncate">{row.original.reason}</div>
        );
      },
    },
    {
      accessorKey: "refundAmount",
      header: "Refund Amount",
      cell: ({ row }) => {
        return formatter.format(row.original.refundAmount || 0);
      },
    },
    {
      accessorKey: "refundMethod",
      header: "Refund Method",
      cell: ({ row }) => {
        return row.original.refundMethod || t("columns.na");
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.date")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <CellAction data={row.original} />,
    },
  ];
};

export const columns: ColumnDef<ReturnColumn>[] = [];
