import { NextRequest, NextResponse } from "next/server";
import { wishlistService } from "@/lib/services/wishlist.service";
import { authenticateRequest, getOrCreateUser } from "@/lib/middleware/auth.middleware";
import { getCorsHeaders } from "@/lib/utils/cors";

/**
 * PUT /api/wishlist/sync
 * Sync local wishlist (from localStorage) with server
 * Useful when user logs in and wants to merge local wishlist with server wishlist
 * 
 * Body: {
 *   productIds: string[] - Product IDs from local storage
 *   mergeStrategy?: "local" | "server" | "merge" (default: "merge")
 *     - "local": Replace server wishlist with local
 *     - "server": Keep server wishlist, ignore local
 *     - "merge": Combine both (union)
 * }
 */
export async function PUT(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult.success || !authResult.userId || !authResult.clerkUserId) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.error || "Unauthorized",
        },
        {
          status: authResult.statusCode || 401,
          headers: corsHeaders,
        }
      );
    }

    // Get or create user
    const user = await getOrCreateUser(
      authResult.clerkUserId!,
      authResult.isStoreUser
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const { productIds, mergeStrategy = "merge" } = body;

    // Validate productIds
    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        {
          success: false,
          message: "productIds must be an array",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate merge strategy
    const validStrategies = ["local", "server", "merge"];
    if (!validStrategies.includes(mergeStrategy)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid mergeStrategy. Must be one of: ${validStrategies.join(", ")}`,
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Get server wishlist
    const serverProductIds = await wishlistService.getUserWishlistProductIds(
      user.id
    );

    let finalProductIds: string[];
    let added = 0;

    switch (mergeStrategy) {
      case "local":
        // Replace server with local
        // First clear server wishlist
        await wishlistService.clearWishlist(user.id);
        // Then add all local items
        if (productIds.length > 0) {
          const result = await wishlistService.batchAddToWishlist(
            user.id,
            productIds
          );
          added = result.added;
        }
        finalProductIds = productIds;
        break;

      case "server":
        // Keep server, ignore local
        finalProductIds = serverProductIds;
        break;

      case "merge":
      default:
        // Merge both (union)
        const mergedIds = Array.from(
          new Set([...serverProductIds, ...productIds])
        );
        // Add only new items (not in server)
        const newIds = productIds.filter(
          (id) => !serverProductIds.includes(id)
        );
        if (newIds.length > 0) {
          const result = await wishlistService.batchAddToWishlist(
            user.id,
            newIds
          );
          added = result.added;
        }
        finalProductIds = mergedIds;
        break;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Wishlist synced successfully",
        data: finalProductIds,
        count: finalProductIds.length,
        added,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("[WISHLIST_SYNC_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal Server Error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

