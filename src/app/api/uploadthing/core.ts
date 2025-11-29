import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

const handleAuth = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return { userId };
};

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "8MB", // Tăng từ 4MB lên 8MB
      maxFileCount: 10,
    },
  })
    .middleware(() => handleAuth())
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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
