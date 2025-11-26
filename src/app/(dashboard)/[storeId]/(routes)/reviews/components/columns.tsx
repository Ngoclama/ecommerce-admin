"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Star, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

export type ReviewColumn = {
  id: string;
  product: string;
  user: string;
  rating: number;
  content: string;
  imageUrl: string;
  createdAt: string;
  isArchived: boolean;
  adminResponse: string | null;
};

export const useReviewColumns = (): ColumnDef<ReviewColumn>[] => {
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
      accessorKey: "product",
      header: t("columns.products"),
    },
    {
      accessorKey: "user",
      header: t("columns.user"),
    },
    {
      accessorKey: "rating",
      header: t("columns.rating"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.rating}{" "}
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        </div>
      ),
    },
    {
      accessorKey: "content",
      header: t("columns.comment"),
      cell: ({ row }) => (
        <span className="italic">"{row.original.content}"</span>
      ),
    },
    {
      accessorKey: "imageUrl",
      header: t("columns.image"),
      cell: ({ row }) =>
        row.original.imageUrl ? (
          <div className="relative w-10 h-10 rounded-md overflow-hidden border border-neutral-200">
            <Image
              src={row.original.imageUrl}
              alt="Review Image"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-10 h-10 bg-neutral-100 rounded-md text-neutral-400">
            <ImageIcon className="h-4 w-4" />
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
    {
      accessorKey: "isArchived",
      header: t("columns.status"),
      cell: ({ row }) => (
        <span
          className={
            row.original.isArchived ? "text-red-500" : "text-green-600"
          }
        >
          {row.original.isArchived ? t("columns.hidden") : t("columns.visible")}
        </span>
      ),
    },
    {
      accessorKey: "adminResponse",
      header: t("columns.adminResponse"),
    },
  ];
};

export const columns: ColumnDef<ReviewColumn>[] = [];
