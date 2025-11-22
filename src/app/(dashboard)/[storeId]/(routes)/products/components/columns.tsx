"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Check, X, ImageOff } from "lucide-react"; // Import icon ảnh lỗi
import Image from "next/image";

export type ProductColumn = {
  id: string;
  name: string;
  price: string;
  size: string;
  category: string;
  color: string;
  inventory: number; // MỚI
  material: string; // MỚI
  gender: string; // MỚI
  isFeatured: boolean;
  isArchived: boolean;
  createdAt: string;
  images: { url: string }[];
};

export const columns: ColumnDef<ProductColumn>[] = [
  {
    accessorKey: "images",
    header: "Image",
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
    header: "Name",
  },
  {
    accessorKey: "inventory", // MỚI: Tồn kho
    header: "Inventory",
  },
  {
    accessorKey: "price",
    header: "Price",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "size",
    header: "Size",
  },
  {
    accessorKey: "color",
    header: "Color",
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
    accessorKey: "material", // MỚI: Chất liệu
    header: "Material",
  },
  {
    accessorKey: "gender", // MỚI: Giới tính
    header: "Gender",
  },
  {
    accessorKey: "isArchived",
    header: "Archived",
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
    header: "Featured",
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
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
