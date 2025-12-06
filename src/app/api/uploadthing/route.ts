import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Force Node.js runtime for file uploads (Edge runtime has limitations with FormData)
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for large file uploads

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
