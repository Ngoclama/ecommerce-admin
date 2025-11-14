import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url }; // giá trị trả về cho client
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
