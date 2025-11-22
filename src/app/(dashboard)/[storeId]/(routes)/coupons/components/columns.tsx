"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { format } from "date-fns";

export type CouponColumn = {
  id: string;
  code: string;
  value: string;
  type: string;
  createdAt: string;
  expirationDate: string;
  isActive: boolean;
};

export const columns: ColumnDef<CouponColumn>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-mono font-bold">{row.original.code}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "value",
    header: "Value",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`font-medium ${
          row.original.isActive ? "text-green-600" : "text-red-500"
        }`}
      >
        {row.original.isActive ? "Active" : "Expired"}
      </span>
    ),
  },
  {
    accessorKey: "expirationDate",
    header: "Expires At",
  },
  {
    accessorKey: "createdAt",
    header: "Date Created",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
