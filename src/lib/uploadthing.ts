import { generateReactHelpers } from "@uploadthing/react";
import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Export tất cả UploadThing utilities từ một file duy nhất
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

export const UploadButton = generateUploadButton<OurFileRouter>();
