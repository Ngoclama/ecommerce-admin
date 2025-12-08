/**
 * Utility để trigger revalidation ở store khi có thay đổi
 */

interface RevalidateOptions {
  type: "product" | "blog" | "category" | "billboard";
  path?: string | string[];
  tag?: string | string[];
}

/**
 * Gọi API revalidate ở store để clear cache
 * Có retry logic để đảm bảo revalidation thành công
 */
export async function revalidateStore(
  options: RevalidateOptions
): Promise<void> {
  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL;
  const revalidateSecret = process.env.REVALIDATE_SECRET_TOKEN;

  if (!storeUrl) {
    console.warn("[REVALIDATE] NEXT_PUBLIC_STORE_URL is not configured");
    return;
  }

  const revalidateUrl = `${storeUrl.replace(/\/$/, "")}/api/revalidate`;
  const maxRetries = 3;
  let lastError: Error | null = null;

  // Retry logic để đảm bảo revalidation thành công
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(revalidateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          ...(revalidateSecret && {
            Authorization: `Bearer ${revalidateSecret}`,
          }),
        },
        body: JSON.stringify({
          type: options.type,
          path: options.path,
          tag: options.tag,
        }),
        // Disable cache for fetch request
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[REVALIDATE] Store revalidated successfully (attempt ${attempt}):`,
            data
          );
        } else {
          // Log in production để debug
          console.log(
            `[REVALIDATE] Success: ${options.type} revalidated (attempt ${attempt})`
          );
        }
        return; // Success, exit retry loop
      }

      // If not OK, log and retry
      const errorText = await response.text().catch(() => response.statusText);
      lastError = new Error(`HTTP ${response.status}: ${errorText}`);

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  // All retries failed
  console.error(
    `[REVALIDATE] Failed to revalidate store after ${maxRetries} attempts:`,
    lastError?.message || "Unknown error"
  );
  console.error(`[REVALIDATE] Store URL: ${storeUrl}`);
  console.error(`[REVALIDATE] Type: ${options.type}`);
}
