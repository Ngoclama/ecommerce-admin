"use client";

// Import các thư viện cần thiết cho bảng dữ liệu
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatter } from "@/lib/utils";
import { CellAction } from "./cell-action";
import { useTranslation } from "@/hooks/use-translation";
import { Checkbox } from "@/components/ui/checkbox";

// Định nghĩa kiểu dữ liệu cho mỗi dòng trong bảng shipping
// Các trường này sẽ được hiển thị trong bảng quản lý vận đơn
export type ShippingColumn = {
  id: string; // ID của shipping record
  orderId: string; // ID của đơn hàng liên quan
  orderNumber?: string; // Số đơn hàng (có thể không có)
  trackingNumber: string; // Mã vận đơn để tracking
  provider: string; // Nhà vận chuyển (GHN, VIETTELPOST, GHTK, CUSTOM)
  status: string; // Trạng thái hiện tại của vận đơn
  toName: string; // Tên người nhận
  toAddress: string; // Địa chỉ người nhận
  shippingCost: number; // Chi phí vận chuyển
  createdAt: string; // Ngày tạo vận đơn
};

// Định nghĩa các cột sẽ hiển thị trong bảng
// Mỗi object là một cột, có thể tùy chỉnh header và cách hiển thị dữ liệu
export const useShippingColumns = (): ColumnDef<ShippingColumn>[] => {
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
    // Cột số đơn hàng - có thể sắp xếp được
    {
      accessorKey: "orderNumber",
      header: ({ column }) => {
        // Header có nút để sort, click vào sẽ đổi chiều sắp xếp
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.orderNumber")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },

    // Cột mã vận đơn - hiển thị dạng monospace để dễ đọc
    {
      accessorKey: "trackingNumber",
      header: t("columns.trackingNumber"),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.trackingNumber}</div>
      ),
    },

    // Cột nhà vận chuyển - hiển thị với badge có màu khác nhau theo từng provider
    {
      accessorKey: "provider",
      header: t("columns.provider"),
    cell: ({ row }) => {
      const provider = row.original.provider;

      // Map màu sắc cho từng nhà vận chuyển
      // GHN = xanh dương, ViettelPost = xanh lá, GHTK = tím, CUSTOM = xám
      const colors: Record<string, string> = {
        GHN: "bg-blue-500/10 text-blue-500",
        VIETTELPOST: "bg-green-500/10 text-green-500",
        GHTK: "bg-purple-500/10 text-purple-500",
        CUSTOM: "bg-gray-500/10 text-gray-500",
      };

      // Nếu không tìm thấy provider trong map thì dùng màu CUSTOM
      return (
        <Badge className={colors[provider] || colors.CUSTOM}>{provider}</Badge>
      );
    },
  },

    // Cột trạng thái - mỗi trạng thái có màu riêng để dễ phân biệt
    {
      accessorKey: "status",
      header: t("columns.status"),
    cell: ({ row }) => {
      const status = row.original.status;

      // Map màu cho từng trạng thái
      // PENDING = vàng, CREATED = xanh dương, PICKED_UP = tím,
      // IN_TRANSIT = indigo, DELIVERED = xanh lá, RETURNED = cam, CANCELLED = đỏ
      const statusColors: Record<string, string> = {
        PENDING: "bg-yellow-500/10 text-yellow-500",
        CREATED: "bg-blue-500/10 text-blue-500",
        PICKED_UP: "bg-purple-500/10 text-purple-500",
        IN_TRANSIT: "bg-indigo-500/10 text-indigo-500",
        DELIVERED: "bg-green-500/10 text-green-500",
        RETURNED: "bg-orange-500/10 text-orange-500",
        CANCELLED: "bg-red-500/10 text-red-500",
      };

      // Hiển thị status, thay dấu _ bằng khoảng trắng cho dễ đọc
      // Nếu không có trong map thì dùng màu PENDING
      return (
        <Badge className={statusColors[status] || statusColors.PENDING}>
          {status.replace("_", " ")}
        </Badge>
      );
    },
  },

    // Cột tên người nhận - hiển thị trực tiếp
    {
      accessorKey: "toName",
      header: t("columns.recipient"),
    },

    // Cột địa chỉ - giới hạn độ dài và truncate nếu quá dài
    {
      accessorKey: "toAddress",
      header: t("columns.address"),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">{row.original.toAddress}</div>
      ),
    },

    // Cột chi phí vận chuyển - format theo định dạng tiền VNĐ
    {
      accessorKey: "shippingCost",
      header: t("columns.cost"),
      cell: ({ row }) => formatter.format(row.original.shippingCost),
    },

    // Cột ngày tạo - có thể sắp xếp được
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        // Header có nút sort giống cột Order #
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.date")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },

    // Cột hành động - chứa các nút xem, sửa, xóa, etc.
    {
      id: "actions",
      cell: ({ row }) => <CellAction data={row.original} />,
    },
  ];
};

// Export default columns for backward compatibility
export const columns: ColumnDef<ShippingColumn>[] = [];
