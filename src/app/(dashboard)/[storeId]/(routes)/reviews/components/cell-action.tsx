"use client";

import axios from "axios";
import { useState } from "react";
import {
  Trash,
  MoreHorizontal,
  Eye,
  EyeOff,
  MessageCircle,
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
import { AlertModal } from "@/components/modals/alert-modal";
import { ReviewReplyModal } from "@/components/modals/review-reply-modal"; // Import Modal vừa tạo
import { ReviewColumn } from "./columns";

interface CellActionProps {
  data: ReviewColumn; // Sửa lại type để lấy được isArchived và adminResponse
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [openReply, setOpenReply] = useState(false); // State mở modal reply

  // Hàm Xóa
  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/reviews/${data.id}`);
      router.refresh();
      toast.success("Review deleted.");
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
      setOpenAlert(false);
    }
  };

  // Hàm Ẩn/Hiện
  const onToggleArchive = async () => {
    try {
      setLoading(true);
      const newStatus = !data.isArchived; 
      await axios.patch(`/api/${params.storeId}/reviews/${data.id}`, {
        isArchived: newStatus,
      });
      toast.success(newStatus ? "Review hidden." : "Review visible.");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openAlert}
        onClose={() => setOpenAlert(false)}
        onConfirm={onDelete}
        loading={loading}
      />

      {/* Modal Trả lời */}
      <ReviewReplyModal
        isOpen={openReply}
        onClose={() => setOpenReply(false)}
        reviewId={data.id}
        initialResponse={data.adminResponse || ""}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          {/* Nút Trả lời */}
          <DropdownMenuItem onClick={() => setOpenReply(true)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            {data.adminResponse ? "Edit Reply" : "Reply"}
          </DropdownMenuItem>

          {/* Nút Ẩn/Hiện */}
          <DropdownMenuItem onClick={onToggleArchive}>
            {data.isArchived ? (
              <>
                <Eye className="mr-2 h-4 w-4" /> Show Review
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" /> Hide Review
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setOpenAlert(true)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
