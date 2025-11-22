"use client";

import axios from "axios";
import { useState } from "react";
import {
  Copy,
  Edit,
  MoreHorizontal,
  Trash,
  Shield,
  ShieldBan,
  Star,
  UserX,
} from "lucide-react";
import { toast } from "sonner"; 
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserColumn } from "./columns";

interface CellActionProps {
  data: UserColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);

  const onToggleVIP = async () => {
    try {
      setLoading(true);
      await axios.patch(`/api/${params.storeId}/users/${data.id}`, {
        isVIP: !data.isVIP,
      });
      toast.success(data.isVIP ? "Đã gỡ VIP" : "Đã set VIP thành công");
      router.refresh();
    } catch (error) {
      toast.error("Lỗi cập nhật VIP");
    } finally {
      setLoading(false);
    }
  };

  const onToggleBan = async () => {
    try {
      setLoading(true);
      await axios.patch(`/api/${params.storeId}/users/${data.id}`, {
        isBanned: !data.isBanned,
      });
      toast.success(data.isBanned ? "Đã bỏ chặn user" : "Đã chặn user này");
      router.refresh();
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/users/${data.id}`);
      toast.success("Đã xóa user khỏi Database");
      router.refresh();
    } catch (error) {
      toast.error("Có lỗi khi xóa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(data.id)}
        >
          <Copy className="mr-2 h-4 w-4" /> Copy ID
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onToggleVIP}>
          {data.isVIP ? (
            <>
              <UserX className="mr-2 h-4 w-4" /> Gỡ VIP
            </>
          ) : (
            <>
              <Star className="mr-2 h-4 w-4 text-yellow-500" /> Set VIP
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onToggleBan}>
          {data.isBanned ? (
            <>
              <Shield className="mr-2 h-4 w-4 text-green-500" /> Mở khóa (Unban)
            </>
          ) : (
            <>
              <ShieldBan className="mr-2 h-4 w-4 text-red-500" /> Chặn (Ban)
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onDelete}>
          <Trash className="mr-2 h-4 w-4" /> Xóa User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CellAction;
