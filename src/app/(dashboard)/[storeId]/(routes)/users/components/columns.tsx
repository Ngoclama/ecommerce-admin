"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import CellAction from "./cell-action";

export type UserColumn = {
  id: string;
  name: string;
  email: string;
  role: string;
  isVIP: boolean;
  isBanned: boolean;
  createdAt: string;
};

export const columns: ColumnDef<UserColumn>[] = [
  {
    accessorKey: "name",
    header: "Tên User",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Quyền (Role)",
  },
  {
    accessorKey: "isVIP",
    header: "VIP",
    cell: ({ row }) =>
      row.original.isVIP ? (
        <span className="text-green-600 font-bold">VIP</span>
      ) : (
        "Thường"
      ),
  },
  {
    accessorKey: "isBanned",
    header: "Trạng thái",
    cell: ({ row }) =>
      row.original.isBanned ? (
        <span className="text-red-600 font-bold">Đã chặn</span>
      ) : (
        <span className="text-green-600">Hoạt động</span>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tham gia",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
