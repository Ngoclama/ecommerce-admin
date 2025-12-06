"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

interface ImageUploadLoadingProps {
  fileName: string;
  progress?: number;
  status?: "uploading" | "success" | "error";
  previewUrl?: string;
  errorMessage?: string;
}

export const ImageUploadLoading: React.FC<ImageUploadLoadingProps> = ({
  fileName,
  progress = 0,
  status = "uploading",
  previewUrl,
  errorMessage,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    if (status === "uploading") {
      const timer = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev < progress) {
            return Math.min(prev + 2, progress);
          }
          return prev;
        });
      }, 50);
      return () => clearInterval(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, status]);

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </motion.div>
        );
      case "error":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <XCircle className="h-5 w-5 text-red-500" />
          </motion.div>
        );
      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-5 w-5 text-blue-500" />
          </motion.div>
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "success":
        return "Tải lên thành công";
      case "error":
        return errorMessage || "Tải lên thất bại";
      default:
        return "Đang tải lên...";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative w-full max-w-sm bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden"
    >
      {/* Preview Image */}
      {previewUrl && (
        <div className="relative w-full h-32 bg-neutral-100 dark:bg-neutral-900">
          <Image
            src={previewUrl}
            alt={fileName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 384px"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {fileName}
            </p>
            <p
              className={`text-xs mt-1 ${
                status === "error"
                  ? "text-red-500"
                  : status === "success"
                  ? "text-green-500"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Progress Bar - Only show when uploading */}
        {status === "uploading" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>Tiến độ</span>
              <span className="font-medium">{Math.round(displayProgress)}%</span>
            </div>
            <div className="relative h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              {/* Background */}
              <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
              
              {/* Progress Fill */}
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ width: "50%" }}
                />
              </motion.div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {status === "error" && errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800"
          >
            {errorMessage}
          </motion.div>
        )}
      </div>

      {/* Success Checkmark Animation */}
      {status === "success" && (
        <motion.div
          className="absolute top-2 right-2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
        >
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Multiple uploads container
interface ImageUploadLoadingListProps {
  uploads: Array<{
    id: string;
    fileName: string;
    progress?: number;
    status?: "uploading" | "success" | "error";
    previewUrl?: string;
    errorMessage?: string;
  }>;
}

export const ImageUploadLoadingList: React.FC<ImageUploadLoadingListProps> = ({
  uploads,
}) => {
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {uploads.map((upload) => (
          <motion.div
            key={upload.id}
            layout
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <ImageUploadLoading
              fileName={upload.fileName}
              progress={upload.progress}
              status={upload.status}
              previewUrl={upload.previewUrl}
              errorMessage={upload.errorMessage}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};


