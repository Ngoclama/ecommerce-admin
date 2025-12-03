"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash } from "lucide-react";
import Image from "next/image";
import { UploadButton } from "@/lib/uploadthing";

// Hàm helper để kiểm tra URL có phải từ UploadThing không
const isUploadThingUrl = (url: string) => {
  return url.includes("ufs.sh") || url.includes("utfs.io");
};

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string[]) => void;
  onRemove: (value: string) => void;
  value: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  onChange,
  onRemove,
  value,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const safeValue = Array.isArray(value) ? value : [];
  const validImages = safeValue.filter(
    (url) => typeof url === "string" && url.trim() !== ""
  );

  return (
    <div className="space-y-4">
      {validImages.length > 0 && (
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          {validImages.map((url) => (
            <div
              key={url}
              className="relative w-[200px] h-[200px] rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800"
            >
              <div className="z-10 absolute top-2 right-2">
                <Button
                  type="button"
                  onClick={() => onRemove(url)}
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 opacity-80 hover:opacity-100"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              <Image
                fill
                className="object-cover"
                alt="Image"
                src={url}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                quality={85}
                unoptimized={isUploadThingUrl(url)}
                onError={(e) => {
                  // Lỗi khi tải hình ảnh - đã được xử lý bởi onError handler
                  // Fallback: có thể thêm placeholder image ở đây nếu cần
                }}
              />
            </div>
          ))}
        </div>
      )}

      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          try {
            if (!res || !Array.isArray(res) || res.length === 0) {
              // Phản hồi upload trống hoặc không hợp lệ
              return;
            }

            // Lấy danh sách URL mới từ response, lọc bỏ các giá trị null/undefined
            // Ưu tiên ufsUrl (UploadThing v9) trước file.url (deprecated)
            const newUrls = res
              .filter((file) => file && file.ufsUrl)
              .map((file) => file.ufsUrl || "")
              .filter((url) => url && url.trim() !== "");

            if (newUrls.length > 0) {
              onChange(newUrls);
            }
          } catch (error) {
            // Lỗi khi xử lý phản hồi upload
            alert("Lỗi khi xử lý ảnh đã tải lên. Vui lòng thử lại.");
          }
        }}
        onUploadError={(error: Error) => {
          // Lỗi khi upload
          alert(`Tải lên thất bại: ${error.message || "Lỗi không xác định"}`);
        }}
        appearance={{
          button:
            "bg-neutral-100 text-neutral-800 border border-neutral-300 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:border-neutral-700 w-full h-[100px] flex flex-col gap-2 transition-colors",
          allowedContent: "hidden",
        }}
        content={{
          button({ ready }) {
            if (ready)
              return (
                <div className="flex flex-col items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  <ImagePlus className="h-6 w-6" /> Tải lên hình ảnh
                </div>
              );
            return "Đang chuẩn bị...";
          },
        }}
      />
    </div>
  );
};

export default ImageUpload;
