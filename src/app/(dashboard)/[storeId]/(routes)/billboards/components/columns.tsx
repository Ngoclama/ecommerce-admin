"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import Image from "next/image";
import { ImageOff } from "lucide-react"; // Import icon để hiển thị khi lỗi ảnh

export type BillboardColumn = {
  id: string;
  label: string;
  imageUrl: string;
  createdAt: string;
};

export const columns: ColumnDef<BillboardColumn>[] = [
  {
    accessorKey: "imageUrl",
    header: "Image",
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
    header: "Label",
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
