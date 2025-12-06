import { auth } from "@clerk/nextjs/server";
import { verifyToken } from "@clerk/backend";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

// Force Node.js runtime for file uploads (Edge runtime has limitations with FormData)
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for large file uploads

const utapi = new UTApi();

// Helper function để lấy Clerk userId từ token hoặc cookies (giống reviews route)
async function getClerkUserId(
  req: Request
): Promise<{ userId: string; isStoreUser: boolean } | null> {
  // Thử lấy từ cookies trước (cho admin)
  try {
    const { userId } = await auth();
    if (userId) {
      return { userId, isStoreUser: false };
    }
  } catch (error) {
    // Ignore error, thử token
  }

  // Thử lấy từ Authorization header (cho store)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      // Thử với Admin Clerk instance trước
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      return { userId: session.sub ?? "", isStoreUser: false };
    } catch (adminErr) {
      // Nếu fail với Admin, thử với Store Clerk instance (nếu có)
      if (process.env.CLERK_STORE_SECRET_KEY) {
        try {
          const session = await verifyToken(token, {
            secretKey: process.env.CLERK_STORE_SECRET_KEY!,
          });
          return { userId: session.sub ?? "", isStoreUser: true };
        } catch (storeErr) {
          if (process.env.NODE_ENV === "development") {
            console.log("[UPLOAD_API] Token verify failed for both instances");
          }
          return null;
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log(
            "[UPLOAD_API] Admin verify failed, no CLERK_STORE_SECRET_KEY"
          );
        }
        return null;
      }
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const clerkAuth = await getClerkUserId(req);
    const userId = clerkAuth?.userId || null;

    if (!userId) {
      console.error(
        "[UPLOAD_API] No userId found. Auth header:",
        req.headers.get("authorization")
      );
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized - Please login to upload files",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[UPLOAD_API] User authenticated:", userId);

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Kiểm tra kích thước file
    // UploadThing hỗ trợ tối đa 64MB cho video
    const maxSize = file.type.startsWith("video/")
      ? 64 * 1024 * 1024
      : 8 * 1024 * 1024;
    if (file.size > maxSize) {
      return new NextResponse(
        JSON.stringify({
          error: `File too large. Max size: ${maxSize / 1024 / 1024}MB`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Upload sử dụng uploadthing server SDK
    try {
      console.log(
        "[UPLOAD_API] Uploading file:",
        file.name,
        file.size,
        file.type
      );

      // UTApi.uploadFiles() nhận File hoặc File[]
      const uploadResult = await utapi.uploadFiles([file]);

      console.log("[UPLOAD_API] Upload result type:", typeof uploadResult);
      console.log(
        "[UPLOAD_API] Upload result:",
        JSON.stringify(uploadResult, null, 2)
      );

      // UTApi.uploadFiles() trả về array của UploadFileResult
      // Type: Array<{ data: { url: string, ... }, error: null }>
      if (Array.isArray(uploadResult) && uploadResult.length > 0) {
        const firstResult = uploadResult[0] as {
          data?: { url?: string; ufsUrl?: string };
          error: null | unknown;
          url?: string;
          ufsUrl?: string;
        };

        // Kiểm tra các property có thể có
        // UploadThing có thể trả về: { data: { url, ufsUrl }, error: null } hoặc { url, ufsUrl, error: null }
        const url =
          firstResult.data?.url ||
          firstResult.data?.ufsUrl ||
          firstResult.url ||
          firstResult.ufsUrl;

        if (url) {
          console.log("[UPLOAD_API] Upload success, URL:", url);
          return NextResponse.json({ url });
        }
        console.error(
          "[UPLOAD_API] No URL found in result:",
          JSON.stringify(firstResult, null, 2)
        );
      }

      return new NextResponse(
        JSON.stringify({
          error: "Upload failed - no URL returned",
          result: uploadResult,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    } catch (uploadError: any) {
      console.error("[UPLOAD_API] Upload error:", uploadError);
      console.error("[UPLOAD_API] Upload error stack:", uploadError.stack);
      return new NextResponse(
        JSON.stringify({
          error: `Upload failed: ${uploadError.message || "Unknown error"}`,
          details: uploadError.toString(),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("[UPLOAD_API] Route error:", error);
    return new NextResponse(
      JSON.stringify({
        error: `Internal Server Error: ${error.message || "Unknown error"}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
