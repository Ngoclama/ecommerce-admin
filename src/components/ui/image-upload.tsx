"use client";

import Image from "next/image";
import { useCallback } from "react";
import { Trash, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  disabled?: boolean;
  value: string[];
  onChange: (url: string) => void;
  onRemove: (url: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  value = [],
  onChange,
  onRemove,
}) => {
  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (const file of Array.from(files)) {
        const fileUrl = URL.createObjectURL(file);
        onChange(fileUrl);
      }
    },
    [onChange]
  );

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
                       transition-all hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
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

            {/* Ảnh */}
            <Image
              fill
              src={url}
              alt="Uploaded image"
              className="object-cover transition-all duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Nút upload */}
      <div>
        <label
          htmlFor="upload-image"
          className={`flex flex-col items-center justify-center gap-2 w-40 h-40 border-2 border-dashed rounded-2xl cursor-pointer 
                      text-sm font-medium text-neutral-700 dark:text-neutral-300
                      bg-white/10 dark:bg-neutral-900/40 
                      shadow-inner backdrop-blur-xl backdrop-saturate-150
                      transition-all hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]
                      ${
                        disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:border-blue-400/50"
                      }`}
        >
          <ImagePlus className="w-6 h-6 opacity-80" />
          <span>Upload an Image</span>
        </label>

        <input
          id="upload-image"
          type="file"
          multiple
          disabled={disabled}
          className="hidden"
          onChange={handleUpload}
        />
      </div>
    </div>
  );
};

export default ImageUpload;
