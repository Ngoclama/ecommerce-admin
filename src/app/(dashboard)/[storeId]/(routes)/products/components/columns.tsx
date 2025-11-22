"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

// 1. Cập nhật Type Definition thêm các trường mới
export type ProductColumn = {
  id: string;
  name: string;
  price: string;
  size: string;
  color: string;
  category: string;
  // ─── NEW FIELDS ───
  material: string;
  gender: string;
  inventory: string; // Hoặc number tùy cách bạn map dữ liệu
  // ──────────────────
  isFeatured: boolean;
  isArchived: boolean;
  createdAt: string;
};

export const columns: ColumnDef<ProductColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "isArchived",
    header: "Archived",
  },
  {
    accessorKey: "isFeatured",
    header: "Featured",
  },
  {
    accessorKey: "price",
    header: "Price",
  },
  // Thêm cột Inventory cạnh Price
  {
    accessorKey: "inventory",
    header: "Inventory",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  // Thêm cột Gender cạnh Category
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "size",
    header: "Size",
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.color}
        <div
          className="h-6 w-6 rounded-full border"
          style={{ backgroundColor: row.original.color }}
        ></div>
      </div>
    ),
  },
  // Thêm cột Material
  {
    accessorKey: "material",
    header: "Material",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];