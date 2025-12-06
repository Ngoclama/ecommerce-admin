import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

const handleAuth = async () => {
  try {
    const { userId } = await auth();
    console.log("UploadThing auth check:", { userId });
    if (!userId) throw new Error("Unauthorized - No userId found");
    return { userId };
  } catch (error) {
    console.error("UploadThing auth error:", error);
    throw error;
  }
};

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "8MB", // Tăng từ 4MB lên 8MB
      maxFileCount: 10,
    },
  })
    .middleware(async () => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      // Tối ưu callback để tránh timeout - chỉ trả về thông tin cần thiết
      // Không thực hiện các thao tác tốn thời gian ở đây
      try {
        console.log("Upload complete:", file.url);
        return { uploadedBy: metadata.userId };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        // Vẫn trả về để không block upload process
        return { uploadedBy: metadata.userId };
      }
    }),
  videoUploader: f({
    video: {
      maxFileSize: "64MB", // UploadThing chỉ hỗ trợ các giá trị cụ thể: 1MB, 2MB, 4MB, 8MB, 16MB, 32MB, 64MB, etc.
      maxFileCount: 5,
    },
  })
    .middleware(async () => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log("Video upload complete:", file.url);
        return { uploadedBy: metadata.userId };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        return { uploadedBy: metadata.userId };
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
