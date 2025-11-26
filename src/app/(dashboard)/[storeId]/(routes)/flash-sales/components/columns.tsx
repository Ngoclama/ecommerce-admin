"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "./cell-action";
import { format } from "date-fns";
import { formatter } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export type FlashSaleColumn = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  discountType: string;
  discountValue: number;
  productCount: number;
  isActive: boolean;
  createdAt: string;
};

export const columns: ColumnDef<FlashSaleColumn>[] = [
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "discount",
    header: "Discount",
    cell: ({ row }) => {
      const type = row.original.discountType;
      const value = row.original.discountValue;
      return (
        <div className="font-semibold text-green-600">
          {type === "PERCENT" ? `${value}%` : formatter.format(value)}
        </div>
      );
    },
  },
  {
    accessorKey: "productCount",
    header: "Products",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.productCount} products</Badge>
    ),
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => format(new Date(row.original.startDate), "MMM dd, yyyy"),
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => format(new Date(row.original.endDate), "MMM dd, yyyy"),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      const now = new Date();
      const start = new Date(row.original.startDate);
      const end = new Date(row.original.endDate);
      const isRunning = isActive && now >= start && now <= end;
      
      return (
        <Badge
          className={
            isRunning
              ? "bg-green-500/10 text-green-500"
              : isActive
              ? "bg-blue-500/10 text-blue-500"
              : "bg-gray-500/10 text-gray-500"
          }
        >
          {isRunning ? "Running" : isActive ? "Scheduled" : "Inactive"}
        </Badge>
      );
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
          Created
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

