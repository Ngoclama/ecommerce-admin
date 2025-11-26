"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Check, X, ImageOff } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

export type ProductColumn = {
  id: string;
  name: string;
  price: string;
  size: string;
  category: string;
  color: string;
  inventory: number;
  material: string;
  gender: string;
  isFeatured: boolean;
  isArchived: boolean;
  createdAt: string;
  images: { url: string }[];
};

export const useProductColumns = (): ColumnDef<ProductColumn>[] => {
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
      accessorKey: "images",
      header: t("columns.image"),
      cell: ({ row }) => {
        const imageSrc = row.original.images?.[0]?.url;

        return (
          <div className="relative w-12 h-12 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 group">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt="Product Image"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
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
      accessorKey: "name",
      header: t("columns.name"),
    },
    {
      accessorKey: "inventory",
      header: t("columns.inventory"),
    },
    {
      accessorKey: "price",
      header: t("columns.price"),
    },
    {
      accessorKey: "category",
      header: t("columns.category"),
    },
    {
      accessorKey: "size",
      header: t("columns.size"),
    },
    {
      accessorKey: "color",
      header: t("columns.color"),
      cell: ({ row }) => (
        <div className="flex items-center gap-x-2">
          {row.original.color}
          <div
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: row.original.color }}
          />
        </div>
      ),
    },
    {
      accessorKey: "material",
      header: t("columns.material"),
    },
    {
      accessorKey: "gender",
      header: t("columns.gender"),
    },
    {
      accessorKey: "isArchived",
      header: t("columns.archived"),
      cell: ({ row }) => (
        <div className="flex items-center gap-x-2">
          {row.original.isArchived ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "isFeatured",
      header: t("columns.featured"),
      cell: ({ row }) => (
        <div className="flex items-center gap-x-2">
          {row.original.isFeatured ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-red-500" />
          )}
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

export const columns: ColumnDef<ProductColumn>[] = [];
