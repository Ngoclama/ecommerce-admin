import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";

const f = createUploadthing();

const handleAuth = async () => {
  try {
    // Thử lấy userId từ Clerk auth() - tự động đọc cookies từ request context
    const { userId } = await auth();

    if (userId) {
      console.log("[UPLOADTHING_AUTH] User authenticated via cookies:", userId);
      return { userId };
    }

    // Nếu không có userId từ cookies, có thể do session expired hoặc chưa đăng nhập
    // Kiểm tra headers để debug
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie");

    console.error("[UPLOADTHING_AUTH] No userId found.", {
      hasCookies: !!cookieHeader,
      cookieLength: cookieHeader?.length || 0,
    });

    throw new Error(
      "Unauthorized - No userId found. Please login to upload files. If you are already logged in, please refresh the page and try again."
    );
  } catch (error) {
    console.error("[UPLOADTHING_AUTH] Auth error:", error);
    // Re-throw với message rõ ràng hơn
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      "Unauthorized - Authentication failed. Please login to upload files."
    );
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
      try {
        console.log("Upload complete:", file.url);
        return { uploadedBy: metadata.userId };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
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
