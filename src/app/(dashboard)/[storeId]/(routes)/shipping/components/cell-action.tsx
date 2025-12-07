// Component hiển thị các action cho mỗi dòng trong bảng shipping
// Có menu dropdown với các tùy chọn: View, Update Tracking, Edit, Copy, Delete

"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Copy, Edit, MoreHorizontal, Trash, Eye, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertModal } from "@/components/modals/alert-modal";
import { ShippingColumn } from "./columns";
import { useShippingViewModal } from "@/hooks/use-shipping-view-modal";
import { useTranslation } from "@/hooks/use-translation";

// Props nhận vào data của một shipping record
interface CellActionProps {
  data: ShippingColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { onOpen } = useShippingViewModal(); // Hook để mở modal xem chi tiết
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false); // Trạng thái loading khi thực hiện action
  const [openAlert, setOpenAlert] = useState(false); // Trạng thái mở modal xác nhận xóa

  /**
   * Hàm xóa shipping order
   * Gọi API để xóa, sau đó refresh lại danh sách
   */
  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/shipping/${data.id}`);
      router.refresh(); // Refresh lại trang để cập nhật danh sách
      toast.success("Đã xóa đơn vận chuyển");
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
      setOpenAlert(false); // Đóng modal xác nhận
    }
  };

  /**
   * Hàm copy tracking number vào clipboard
   * Dùng để copy mã vận đơn nhanh
   */
  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Đã sao chép ID đơn vận chuyển");
  };

  /**
   * Hàm cập nhật thông tin tracking từ provider
   * Gọi API để lấy thông tin mới nhất từ nhà vận chuyển
   */
  const onTrack = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `/api/${params.storeId}/shipping/tracking`,
        { trackingNumber: data.trackingNumber }
      );
      toast.success("Đã cập nhật thông tin vận chuyển!");
      router.refresh(); // Refresh để hiển thị thông tin mới
    } catch (error) {
      toast.error("Không thể cập nhật thông tin vận chuyển");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal xác nhận xóa */}
      <AlertModal
        isOpen={openAlert}
        onClose={() => setOpenAlert(false)}
        onConfirm={onDelete}
        loading={loading}
      />

      {/* Menu dropdown với các action */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("columns.actions")}</DropdownMenuLabel>

          {/* Xem chi tiết shipping */}
          <DropdownMenuItem
            onClick={() => onOpen(data.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            {t("actions.view")}
          </DropdownMenuItem>

          {/* Cập nhật thông tin tracking từ provider */}
          <DropdownMenuItem
            onClick={onTrack}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Truck className="h-4 w-4" />
            {t("actions.updateTracking")}
          </DropdownMenuItem>

          {/* Chỉnh sửa shipping order */}
          <DropdownMenuItem
            onClick={() => {
              router.push(`/${params.storeId}/shipping/${data.id}`);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Edit className="h-4 w-4" />
            {t("actions.edit")}
          </DropdownMenuItem>

          {/* Copy tracking number vào clipboard */}
          <DropdownMenuItem
            onClick={() => onCopy(data.trackingNumber)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Copy className="h-4 w-4" />
            {t("actions.copyTracking")}
          </DropdownMenuItem>

          {/* Xóa shipping order */}
          <DropdownMenuItem
            onClick={() => setOpenAlert(true)}
            className="flex items-center gap-2 cursor-pointer text-red-500"
          >
            <Trash className="h-4 w-4" />
            {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
