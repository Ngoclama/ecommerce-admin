"use client";

import Image from "next/image";
import { Trash, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/utils/uploadthing";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface ImageUploadProps {
  disabled?: boolean;
  value: string[];
  onChange: (url: string) => void;
  onRemove: (url: string) => void;
}

const ImageUpload = ({
  disabled,
  value,
  onChange,
  onRemove,
}: ImageUploadProps) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Preview ảnh */}
      <div className="flex flex-wrap gap-5">
        {value.map((url) => (
          <div
            key={url}
            className="relative w-40 h-40 rounded-2xl overflow-hidden border border-white/20 
                       bg-white/10 dark:bg-neutral-800/30 
                       shadow-[0_4px_20px_rgba(0,0,0,0.15)] 
                       backdrop-blur-xl backdrop-saturate-150
                       transition-all hover:scale-[1.03]"
          >
            {/* Nút xoá */}
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-full shadow-lg backdrop-blur-md 
                           bg-red-500/80 hover:bg-red-600/90 transition-all"
              >
                <Trash className="h-4 w-4 text-white" />
              </Button>
            </div>

            {/* Ảnh từ URL thật */}
            <Image
              fill
              src={url}
              alt="Uploaded image"
              className="object-cover transition-all duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Nút UploadThing */}
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          if (!res) return;
          for (const file of res) {
            onChange(file.url);
          }
        }}
        onUploadError={(err) => console.error(err)}
        appearance={{
          button:
            "flex flex-col items-center justify-center gap-2 w-40 h-40 border-2 border-dashed rounded-2xl cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white/10 dark:bg-neutral-900/40 shadow-inner backdrop-blur-xl transition-all hover:scale-[1.03]",
        }}
        content={{
          button: (
            <div className="flex flex-col items-center gap-1">
              <ImagePlus className="w-6 h-6 opacity-80" />
              <span>Upload Image</span>

              {/* Dòng mô tả thêm */}
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Upload Image
              </span>
            </div>
          ),
        }}
      />
    </div>
  );
};

export default ImageUpload;
