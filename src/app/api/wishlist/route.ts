import { NextRequest, NextResponse } from "next/server";
import { wishlistService } from "@/lib/services/wishlist.service";
import { authenticateRequest, getOrCreateUser } from "@/lib/middleware/auth.middleware";
import { getCorsHeaders } from "@/lib/utils/cors";

/**
 * POST /api/wishlist
 * Add, remove, or toggle product in wishlist
 * 
 * Body: {
 *   productId: string (required)
 *   action?: "add" | "remove" | "toggle" (default: "toggle")
 * }
 */
export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Authenticate request
    const authResult = await authenticateRequest(req);
    if (!authResult.success || !authResult.userId || !authResult.clerkUserId) {
      return NextResponse.json(
        {
          success: false,
          message: authResult.error || "Unauthorized - Please sign in",
        },
        {
          status: authResult.statusCode || 401,
          headers: corsHeaders,
        }
      );
    }

    // Parse and validate request body
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

    const { productId, action = "toggle" } = body;

    // Validate productId
    if (!productId || typeof productId !== "string" || productId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required and must be a non-empty string",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate action
    const validActions = ["add", "remove", "toggle"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid action. Must be one of: ${validActions.join(", ")}`,
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Get or create user (ensure user exists in DB)
    const user = await getOrCreateUser(
      authResult.clerkUserId!,
      authResult.isStoreUser
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to get or create user account",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // Execute wishlist operation
    let result;
    switch (action) {
      case "add":
        result = await wishlistService.addToWishlist(user.id, productId);
        break;
      case "remove":
        result = await wishlistService.removeFromWishlist(user.id, productId);
        break;
      case "toggle":
      default:
        result = await wishlistService.toggleWishlist(user.id, productId);
        break;
    }

    return NextResponse.json(
      {
        success: result.success,
        isLiked: result.isLiked,
        message: result.message,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("[WISHLIST_POST_ERROR]", error);

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

/**
 * GET /api/wishlist
 * Get user's wishlist product IDs
 * 
 * Query params:
 *   - includeDetails?: boolean (default: false) - Include full product details
 *   - limit?: number - Limit results
 *   - offset?: number - Pagination offset
 */
export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Access-Control-Max-Age": "86400",
        },
      });
    }

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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const includeDetails = searchParams.get("includeDetails") === "true";
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : undefined;

    // Validate pagination params
    if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
      return NextResponse.json(
        {
          success: false,
          message: "Limit must be between 1 and 100",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (offset !== undefined && (isNaN(offset) || offset < 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "Offset must be >= 0",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Fetch wishlist
    if (includeDetails) {
      const wishlistItems = await wishlistService.getUserWishlist(user.id, {
        includeProduct: true,
        limit,
        offset,
      });

      return NextResponse.json(
        {
          success: true,
          data: wishlistItems,
          count: wishlistItems.length,
        },
        {
          headers: corsHeaders,
        }
      );
    } else {
      const productIds = await wishlistService.getUserWishlistProductIds(
        user.id
      );
      const count = await wishlistService.getWishlistCount(user.id);

      return NextResponse.json(
        {
          success: true,
          data: productIds,
          count,
        },
        {
          headers: corsHeaders,
        }
      );
    }
  } catch (error) {
    console.error("[WISHLIST_GET_ERROR]", error);

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

/**
 * DELETE /api/wishlist
 * Clear user's entire wishlist or remove specific products
 * 
 * Body (optional): {
 *   productIds?: string[] - If provided, remove only these products
 *   clearAll?: boolean - If true, clear entire wishlist
 * }
 */
export async function DELETE(req: NextRequest) {
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
    let body: { productIds?: string[]; clearAll?: boolean } = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (parseError) {
      // Body is optional for DELETE
    }

    const { productIds, clearAll } = body;

    if (clearAll) {
      // Clear entire wishlist
      const result = await wishlistService.clearWishlist(user.id);
      return NextResponse.json(
        {
          success: true,
          message: `Cleared ${result.deleted} items from wishlist`,
          deleted: result.deleted,
        },
        {
          headers: corsHeaders,
        }
      );
    } else if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      // Remove specific products
      let removed = 0;
      for (const productId of productIds) {
        const result = await wishlistService.removeFromWishlist(
          user.id,
          productId
        );
        if (result.success && !result.isLiked) {
          removed++;
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: `Removed ${removed} products from wishlist`,
          removed,
        },
        {
          headers: corsHeaders,
        }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message:
            "Either 'clearAll: true' or 'productIds' array must be provided",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }
  } catch (error) {
    console.error("[WISHLIST_DELETE_ERROR]", error);

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
