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
 */
export async function revalidateStore(
  options: RevalidateOptions
): Promise<void> {
  try {
    const storeUrl = process.env.NEXT_PUBLIC_STORE_URL;
    const revalidateSecret = process.env.REVALIDATE_SECRET_TOKEN;

    if (!storeUrl) {
      console.warn("[REVALIDATE] NEXT_PUBLIC_STORE_URL is not configured");
      return;
    }

    const revalidateUrl = `${storeUrl.replace(/\/$/, "")}/api/revalidate`;

    const response = await fetch(revalidateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(revalidateSecret && {
          Authorization: `Bearer ${revalidateSecret}`,
        }),
      },
      body: JSON.stringify({
        type: options.type,
        path: options.path,
        tag: options.tag,
      }),
    });

    if (!response.ok) {
      console.error(
        `[REVALIDATE] Failed to revalidate store: ${response.status} ${response.statusText}`
      );
      return;
    }

    const data = await response.json();
    if (process.env.NODE_ENV === "development") {
      console.log("[REVALIDATE] Store revalidated successfully:", data);
    }
  } catch (error) {
    // Không throw error để không ảnh hưởng đến flow chính
    console.error("[REVALIDATE] Error revalidating store:", error);
  }
}
