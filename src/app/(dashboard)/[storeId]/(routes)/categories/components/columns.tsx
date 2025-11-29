"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

export type CategoryColumn = {
  id: string;
  name: string;
  slug: string;
  billboardLabel: string;
  parentName?: string | null;
  parentId?: string;
  level?: number;
  hasChildren?: boolean;
  productsCount?: string;
  createdAt: string;
};

export const useCategoryColumns = (
  expandedIds: Set<string>,
  onToggleExpand: (id: string) => void
): ColumnDef<CategoryColumn>[] => {
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
      cell: ({ row }) => {
        const level = row.original.level || 0;
        const hasChildren = row.original.hasChildren || false;
        const isExpanded = expandedIds.has(row.original.id);

        return (
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(row.original.id);
                }}
                className="flex items-center justify-center w-5 h-5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                )}
              </button>
            ) : (
              <div className="w-5" /> // Spacer for alignment
            )}
            <span className="font-medium">{row.original.name}</span>
            {row.original.parentName && (
              <span className="text-xs text-muted-foreground">
                ({row.original.parentName})
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "slug",
      header: t("columns.slug"),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-mono text-sm bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md inline-block">
          {row.original.slug}
        </div>
      ),
    },
    {
      accessorKey: "billboardLabel",
      header: t("columns.billboard"),
      cell: ({ row }) => row.original.billboardLabel,
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

export const columns: ColumnDef<CategoryColumn>[] = [];
