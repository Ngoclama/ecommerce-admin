"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

export type ColorColumn = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
  productsCount: string;
};

export const useColorColumns = (): ColumnDef<ColorColumn>[] => {
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
      accessorKey: "value",
      header: t("columns.value"),
      cell: ({ row }) => (
        <div className="flex items-center gap-x-2">
          {row.original.value}
          <div
            className="h-6 w-6 rounded-full border border-neutral-200"
            style={{ backgroundColor: row.original.value }}
          />
        </div>
      ),
    },
    {
      accessorKey: "productsCount",
      header: t("columns.products"),
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

export const columns: ColumnDef<ColorColumn>[] = [];
