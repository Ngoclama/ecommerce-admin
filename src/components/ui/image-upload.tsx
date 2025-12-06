"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash } from "lucide-react";
import Image from "next/image";
import { UploadButton } from "@/lib/uploadthing";
import { ImageUploadLoadingList } from "./image-upload-loading";
import { toast } from "sonner";

// Hàm helper để kiểm tra URL có phải từ UploadThing không
const isUploadThingUrl = (url: string) => {
  return url.includes("ufs.sh") || url.includes("utfs.io");
};

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string[]) => void;
  onRemove: (value: string) => void;
  value: string[];
  maxFiles?: number; // Số lượng ảnh tối đa cho phép
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  onChange,
  onRemove,
  value,
  maxFiles,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [uploads, setUploads] = useState<
    Array<{
      id: string;
      fileName: string;
      progress?: number;
      status?: "uploading" | "success" | "error";
      previewUrl?: string;
      errorMessage?: string;
    }>
  >([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto remove completed uploads after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setUploads((prev) =>
        prev.filter((upload) => upload.status !== "success")
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [uploads]);

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
        onUploadProgress={(progress) => {
          // Update progress for all uploading files
          setUploads((prev) =>
            prev.map((upload) =>
              upload.status === "uploading" ? { ...upload, progress } : upload
            )
          );
        }}
        onUploadBegin={(name) => {
          // Create preview URL from file
          const file = (
            document.querySelector('input[type="file"]') as HTMLInputElement
          )?.files?.[0];
          const previewUrl = file ? URL.createObjectURL(file) : undefined;

          // Add new upload to list
          const uploadId = `${Date.now()}-${Math.random()}`;
          setUploads((prev) => [
            ...prev,
            {
              id: uploadId,
              fileName: name,
              progress: 0,
              status: "uploading",
              previewUrl,
            },
          ]);
        }}
        onClientUploadComplete={(res) => {
          try {
            if (!res || !Array.isArray(res) || res.length === 0) {
              // Phản hồi upload trống hoặc không hợp lệ
              setUploads((prev) =>
                prev.map((upload) =>
                  upload.status === "uploading"
                    ? {
                        ...upload,
                        status: "error" as const,
                        errorMessage: "Không có phản hồi từ server",
                      }
                    : upload
                )
              );
              return;
            }

            // Lấy danh sách URL mới từ response, lọc bỏ các giá trị null/undefined
            // Ưu tiên ufsUrl (UploadThing v9) trước file.url (deprecated)
            const newUrls = res
              .filter((file) => file && file.ufsUrl)
              .map((file) => file.ufsUrl || "")
              .filter((url) => url && url.trim() !== "");

            // Kiểm tra maxFiles nếu được chỉ định
            if (maxFiles !== undefined) {
              const currentImages = validImages.length;
              const totalAfterUpload = currentImages + newUrls.length;

              if (totalAfterUpload > maxFiles) {
                // Hiển thị toast thông báo
                toast.error(
                  `Chỉ được phép tải lên tối đa ${maxFiles} ảnh. Hiện tại bạn đã có ${currentImages} ảnh và đang cố tải thêm ${newUrls.length} ảnh.`
                );

                // Đánh dấu uploads là lỗi
                setUploads((prev) =>
                  prev.map((upload) =>
                    upload.status === "uploading"
                      ? {
                          ...upload,
                          status: "error" as const,
                          errorMessage: `Vượt quá giới hạn ${maxFiles} ảnh`,
                        }
                      : upload
                  )
                );
                return;
              }

              // Nếu chỉ cho phép 1 ảnh và đã có ảnh, chỉ lấy ảnh đầu tiên
              if (maxFiles === 1 && currentImages > 0) {
                toast.error(
                  "Chỉ được phép tải lên 1 ảnh quảng cáo. Vui lòng xóa ảnh hiện tại trước khi tải ảnh mới."
                );
                setUploads((prev) =>
                  prev.map((upload) =>
                    upload.status === "uploading"
                      ? {
                          ...upload,
                          status: "error" as const,
                          errorMessage: "Chỉ được phép 1 ảnh",
                        }
                      : upload
                  )
                );
                return;
              }
            }

            // Update uploads to success
            setUploads((prev) =>
              prev.map((upload) =>
                upload.status === "uploading"
                  ? {
                      ...upload,
                      status: "success" as const,
                      progress: 100,
                    }
                  : upload
              )
            );

            if (newUrls.length > 0) {
              // Nếu maxFiles = 1, chỉ lấy ảnh đầu tiên
              if (maxFiles === 1) {
                onChange([newUrls[0]]);
              } else {
                onChange(newUrls);
              }
            }
          } catch (error) {
            // Lỗi khi xử lý phản hồi upload
            setUploads((prev) =>
              prev.map((upload) =>
                upload.status === "uploading"
                  ? {
                      ...upload,
                      status: "error" as const,
                      errorMessage: "Lỗi khi xử lý ảnh đã tải lên",
                    }
                  : upload
              )
            );
          }
        }}
        onUploadError={(error: Error) => {
          // Lỗi khi upload
          setUploads((prev) =>
            prev.map((upload) =>
              upload.status === "uploading"
                ? {
                    ...upload,
                    status: "error" as const,
                    errorMessage: error.message || "Lỗi không xác định",
                  }
                : upload
            )
          );
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

      {/* Loading Overlay */}
      <ImageUploadLoadingList uploads={uploads} />
    </div>
  );
};

export default ImageUpload;
