"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import CellAction from "./cell-action";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

export type UserColumn = {
  id: string;
  name: string;
  email: string;
  role: string;
  isVIP: boolean;
  isBanned: boolean;
  createdAt: string;
};

export const useUserColumns = (): ColumnDef<UserColumn>[] => {
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
      accessorKey: "name",
      header: t("columns.name"),
    },
    {
      accessorKey: "email",
      header: t("columns.email"),
    },
    {
      accessorKey: "role",
      header: t("columns.role"),
    },
    {
      accessorKey: "isVIP",
      header: t("columns.vip"),
      cell: ({ row }) =>
        row.original.isVIP ? (
          <span className="text-green-600 font-bold">VIP</span>
        ) : (
          t("columns.regular")
        ),
    },
    {
      accessorKey: "isBanned",
      header: t("columns.status"),
      cell: ({ row }) =>
        row.original.isBanned ? (
          <span className="text-red-600 font-bold">{t("columns.banned")}</span>
        ) : (
          <span className="text-green-600">{t("columns.active")}</span>
        ),
    },
    {
      accessorKey: "createdAt",
      header: t("columns.joinedDate"),
    },
    {
      id: "actions",
      cell: ({ row }) => <CellAction data={row.original} />,
    },
  ];
};

// Export default columns for backward compatibility
export const columns: ColumnDef<UserColumn>[] = [];
