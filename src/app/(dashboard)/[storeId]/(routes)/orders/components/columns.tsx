"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Badge } from "@/components/ui/badge";

export type OrderColumn = {
  id: string;
  phone: string;
  address: string;
  isPaid: boolean;
  totalPrice: string;
  products: string;
  createdAt: string;
  // Các trường mới cần thêm:
  status: string;
  shippingProvider: string | null;
  trackingNumber: string | null;
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
      <Badge variant={row.original.isPaid ? "default" : "destructive"}>
        {row.original.isPaid ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let color = "secondary";
      if (status === "SHIPPED") color = "default"; // Blue-ish by default
      if (status === "DELIVERED") color = "success"; // Bạn có thể style thêm class nếu muốn màu xanh lá
      if (status === "CANCELLED") color = "destructive";

      return (
        <Badge variant={color as any} className="uppercase text-[10px]">
          {status}
        </Badge>
      );
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
