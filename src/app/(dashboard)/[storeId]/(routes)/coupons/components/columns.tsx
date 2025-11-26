"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

export type CouponColumn = {
  id: string;
  code: string;
  value: string;
  type: string;
  createdAt: string;
  expirationDate: string;
  isActive: boolean;
};

export const useCouponColumns = (): ColumnDef<CouponColumn>[] => {
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
      accessorKey: "code",
      header: t("columns.code"),
      cell: ({ row }) => (
        <span className="font-mono font-bold">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "value",
      header: t("columns.value"),
    },
    {
      accessorKey: "isActive",
      header: t("columns.status"),
      cell: ({ row }) => (
        <span
          className={`font-medium ${
            row.original.isActive ? "text-green-600" : "text-red-500"
          }`}
        >
          {row.original.isActive ? t("columns.active") : "Expired"}
        </span>
      ),
    },
    {
      accessorKey: "expirationDate",
      header: t("columns.expiresAt"),
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

export const columns: ColumnDef<CouponColumn>[] = [];
