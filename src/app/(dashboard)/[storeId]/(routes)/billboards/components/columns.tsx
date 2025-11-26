"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

export type BillboardColumn = {
  id: string;
  label: string;
  imageUrl: string;
  createdAt: string;
};

export const useBillboardColumns = (): ColumnDef<BillboardColumn>[] => {
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
      accessorKey: "imageUrl",
      header: t("columns.image"),
    cell: ({ row }) => {
      // Lấy giá trị imageUrl từ dữ liệu hàng
      const imageSrc = row.original.imageUrl;

      return (
        <div className="relative w-24 h-12 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
          {imageSrc ? (
            <Image
              fill
              src={imageSrc}
              alt="Billboard Image"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-neutral-400">
              <ImageOff className="h-4 w-4" />
            </div>
          )}
        </div>
      );
    },
  },
    {
      accessorKey: "label",
      header: t("columns.label"),
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

export const columns: ColumnDef<BillboardColumn>[] = [];
