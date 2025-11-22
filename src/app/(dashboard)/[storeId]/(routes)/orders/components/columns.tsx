"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

export type OrderColumn = {
  id: string;
  phone: string;
  address: string;
  isPaid: boolean;
  totalPrice: string;
  products: string;
  createdAt: string;
  status: string;
};

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "products",
    header: "Products",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "totalPrice",
    header: "Total Price",
  },
  {
    accessorKey: "isPaid",
    header: "Paid",
    cell: ({ row }) => (
      <span
        className={`font-semibold ${
          row.original.isPaid ? "text-green-600" : "text-red-500"
        }`}
      >
        {row.original.isPaid ? "Paid" : "Unpaid"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let colorClass = "text-neutral-500";

      if (status === "PENDING") colorClass = "text-yellow-600";
      if (status === "PROCESSING") colorClass = "text-blue-600";
      if (status === "SHIPPED") colorClass = "text-indigo-600";
      if (status === "DELIVERED") colorClass = "text-green-600 font-bold";
      if (status === "CANCELLED") colorClass = "text-red-600";

      return <span className={colorClass}>{status}</span>;
    },
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