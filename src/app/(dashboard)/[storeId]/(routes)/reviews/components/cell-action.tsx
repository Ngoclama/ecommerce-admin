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
import { ReviewReplyModal } from "@/components/modals/review-reply-modal";
import { ReviewColumn } from "./columns";
import { useTranslation } from "@/hooks/use-translation";

interface CellActionProps {
  data: ReviewColumn; // Sửa lại type để lấy được isArchived và adminResponse
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [openReply, setOpenReply] = useState(false);

  // Hàm Xóa
  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/reviews/${data.id}`);
      router.refresh();
      toast.success(t("actions.reviewDeleted"));
    } catch (error) {
      toast.error(t("actions.somethingWentWrong"));
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
      toast.success(
        newStatus ? t("actions.reviewHidden") : t("actions.reviewVisible")
      );
      router.refresh();
    } catch (error) {
      toast.error(t("actions.somethingWentWrong"));
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
            <span className="sr-only">{t("actions.openMenu")}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("columns.actions")}</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setOpenReply(true)}>
            <MessageCircle className="mr-2 h-4 w-4" />
            {data.adminResponse ? t("actions.editReply") : t("actions.reply")}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onToggleArchive}>
            {data.isArchived ? (
              <>
                <Eye className="mr-2 h-4 w-4" /> {t("actions.showReview")}
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" /> {t("actions.hideReview")}
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setOpenAlert(true)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" /> {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
