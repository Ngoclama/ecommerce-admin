"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "./cell-action";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

export type BlogPostColumn = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  categoryName: string;
  isPublished: boolean;
  createdAt: string;
};

export const useBlogColumns = (): ColumnDef<BlogPostColumn>[] => {
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
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.title")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "excerpt",
      header: t("columns.excerpt"),
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate text-sm text-neutral-500">
          {row.original.excerpt || "No excerpt"}
        </div>
      ),
    },
    {
      accessorKey: "categoryName",
      header: t("columns.category"),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.categoryName}</Badge>
      ),
    },
    {
      accessorKey: "isPublished",
      header: t("columns.status"),
      cell: ({ row }) => {
        const isPublished = row.original.isPublished;
        return (
          <Badge
            className={
              isPublished
                ? "bg-green-500/10 text-green-500"
                : "bg-gray-500/10 text-gray-500"
            }
          >
            {isPublished ? t("columns.published") : t("columns.draft")}
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
            {t("columns.created")}
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

export const columns: ColumnDef<BlogPostColumn>[] = [];
