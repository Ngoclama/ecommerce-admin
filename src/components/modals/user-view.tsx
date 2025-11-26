"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { User } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Image from "next/image";
import { useTranslation } from "@/hooks/use-translation";

interface UserViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: User | null;
}

export const UserViewModal: React.FC<UserViewModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const { t } = useTranslation();
  if (!data) return null;

  return (
    <Modal
      title={t("modals.userDetails")}
      description={t("modals.userDescription")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Avatar */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative h-32 w-32 rounded-full overflow-hidden border">
            <Image
              fill
              src={data.imageUrl || "/placeholder-user.jpg"}
              alt="User Avatar"
              className="object-cover"
            />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-xl">{data.name}</h3>
            <p className="text-sm text-muted-foreground">{data.email}</p>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-semibold">ID:</span>
            <span className="text-xs text-muted-foreground">{data.id}</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-semibold">{t("modals.role")}</span>
            <Badge variant="outline">{data.role}</Badge>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-semibold">{t("columns.status")}:</span>
            <div className="flex gap-2">
              {data.isVIP && (
                <Badge className="bg-yellow-500">{t("columns.vip")}</Badge>
              )}
              {data.isBanned ? (
                <Badge variant="destructive">{t("columns.banned")}</Badge>
              ) : (
                <Badge variant="secondary">{t("columns.active")}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-semibold">{t("modals.joinedDate")}</span>
            <span className="text-sm">
              {format(new Date(data.createdAt), "dd/MM/yyyy")}
            </span>
          </div>
        </div>
      </div>
      <div className="pt-6 w-full flex items-center justify-end">
        <Button onClick={onClose} variant="outline">
          {t("modals.close")}
        </Button>
      </div>
    </Modal>
  );
};
