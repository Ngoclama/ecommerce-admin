"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Star, ImageIcon } from "lucide-react";
import Image from "next/image";
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

export const columns: ColumnDef<ReviewColumn>[] = [
  {
    accessorKey: "product",
    header: "Product",
  },
  {
    accessorKey: "user",
    header: "User",
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {row.original.rating}{" "}
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      </div>
    ),
  },
  {
    accessorKey: "content",
    header: "Comment",
    cell: ({ row }) => <span className="italic">"{row.original.content}"</span>,
  },
  {
    accessorKey: "imageUrl",
    header: "Image",
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
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
  {
    accessorKey: "isArchived",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={row.original.isArchived ? "text-red-500" : "text-green-600"}
      >
        {row.original.isArchived ? "Hidden" : "Visible"}
      </span>
    ),
  },
  {
    accessorKey: "adminResponse",
    header: "Admin Response",
  },
];
