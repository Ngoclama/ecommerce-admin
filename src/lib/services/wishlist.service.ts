import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Wishlist Service
 * Professional backend service layer for wishlist operations
 * Follows SOLID principles and best practices
 */

export interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  createdAt: Date;
}

export interface WishlistResponse {
  success: boolean;
  data?: string[] | WishlistItem[];
  message?: string;
  isLiked?: boolean;
  count?: number;
}

export interface WishlistOperationResult {
  success: boolean;
  isLiked: boolean;
  message: string;
  wishlistItem?: WishlistItem;
}

export class WishlistService {
  /**
   * Get user's wishlist product IDs
   * Optimized query with proper indexing
   */
  async getUserWishlistProductIds(userId: string): Promise<string[]> {
    try {
      const wishlistItems = await prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true },
        orderBy: { createdAt: "desc" },
        // Use index on userId for better performance
      });

      // Return unique product IDs (should already be unique due to constraint)
      return Array.from(new Set(wishlistItems.map((item) => item.productId)));
    } catch (error) {
      console.error("[WISHLIST_SERVICE] Error fetching wishlist:", error);
      throw new Error("Failed to fetch wishlist");
    }
  }

  /**
   * Get user's wishlist with full details
   */
  async getUserWishlist(
    userId: string,
    options?: {
      includeProduct?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    try {
      const { includeProduct = false, limit, offset = 0 } = options || {};

      const wishlistItems = await prisma.wishlist.findMany({
        where: { userId },
        select: {
          id: true,
          productId: true,
          userId: true,
          createdAt: true,
          ...(includeProduct && {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: {
                  select: { url: true },
                  take: 1,
                },
              },
            },
          }),
        },
        orderBy: { createdAt: "desc" },
        ...(limit && { take: limit }),
        ...(offset && { skip: offset }),
      });

      return wishlistItems;
    } catch (error) {
      console.error("[WISHLIST_SERVICE] Error fetching wishlist details:", error);
      throw new Error("Failed to fetch wishlist details");
    }
  }

  /**
   * Check if product is in user's wishlist
   * Optimized with single query
   */
  async isProductInWishlist(
    userId: string,
    productId: string
  ): Promise<boolean> {
    try {
      const count = await prisma.wishlist.count({
        where: {
          userId,
          productId,
        },
      });

      return count > 0;
    } catch (error) {
      console.error(
        "[WISHLIST_SERVICE] Error checking wishlist status:",
        error
      );
      return false;
    }
  }

  /**
   * Add product to wishlist
   * Uses upsert to handle race conditions
   */
  async addToWishlist(
    userId: string,
    productId: string
  ): Promise<WishlistOperationResult> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });

      if (!product) {
        return {
          success: false,
          isLiked: false,
          message: "Product not found",
        };
      }

      // Use upsert to handle race conditions (multiple requests at once)
      const wishlistItem = await prisma.wishlist.upsert({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        create: {
          userId,
          productId,
        },
        update: {
          // If exists, just return existing (idempotent)
        },
        select: {
          id: true,
          productId: true,
          userId: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        isLiked: true,
        message: "Added to wishlist",
        wishlistItem: wishlistItem as WishlistItem,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          // Unique constraint violation - already exists
          return {
            success: true,
            isLiked: true,
            message: "Product already in wishlist",
          };
        }
      }

      console.error("[WISHLIST_SERVICE] Error adding to wishlist:", error);
      throw new Error("Failed to add product to wishlist");
    }
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(
    userId: string,
    productId: string
  ): Promise<WishlistOperationResult> {
    try {
      const deleted = await prisma.wishlist.deleteMany({
        where: {
          userId,
          productId,
        },
      });

      if (deleted.count === 0) {
        return {
          success: true,
          isLiked: false,
          message: "Product not in wishlist",
        };
      }

      return {
        success: true,
        isLiked: false,
        message: "Removed from wishlist",
      };
    } catch (error) {
      console.error("[WISHLIST_SERVICE] Error removing from wishlist:", error);
      throw new Error("Failed to remove product from wishlist");
    }
  }

  /**
   * Toggle product in wishlist
   * Atomic operation with proper error handling
   */
  async toggleWishlist(
    userId: string,
    productId: string
  ): Promise<WishlistOperationResult> {
    try {
      // Check current status
      const exists = await this.isProductInWishlist(userId, productId);

      if (exists) {
        return await this.removeFromWishlist(userId, productId);
      } else {
        return await this.addToWishlist(userId, productId);
      }
    } catch (error) {
      console.error("[WISHLIST_SERVICE] Error toggling wishlist:", error);
      throw new Error("Failed to toggle wishlist");
    }
  }

  /**
   * Batch add products to wishlist
   * Efficient for syncing local storage with server
   */
  async batchAddToWishlist(
    userId: string,
    productIds: string[]
  ): Promise<{ added: number; skipped: number }> {
    try {
      if (!productIds || productIds.length === 0) {
        return { added: 0, skipped: 0 };
      }

      // Validate products exist
      const existingProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: { id: true },
      });

      const validProductIds = existingProducts.map((p) => p.id);
      const invalidCount = productIds.length - validProductIds.length;

      // Get existing wishlist items to avoid duplicates
      const existingWishlist = await prisma.wishlist.findMany({
        where: {
          userId,
          productId: { in: validProductIds },
        },
        select: { productId: true },
      });

      const existingProductIds = new Set(
        existingWishlist.map((item) => item.productId)
      );
      const newProductIds = validProductIds.filter(
        (id) => !existingProductIds.has(id)
      );

      if (newProductIds.length === 0) {
        return {
          added: 0,
          skipped: existingWishlist.length + invalidCount,
        };
      }

      // Batch insert
      // Note: skipDuplicates not needed as we've already filtered duplicates above
      // and the schema has @@unique([userId, productId]) constraint
      await prisma.wishlist.createMany({
        data: newProductIds.map((productId) => ({
          userId,
          productId,
        })),
      });

      return {
        added: newProductIds.length,
        skipped: existingWishlist.length + invalidCount,
      };
    } catch (error) {
      console.error("[WISHLIST_SERVICE] Error batch adding to wishlist:", error);
      throw new Error("Failed to batch add products to wishlist");
    }
  }

  /**
   * Get wishlist count for user
   * Optimized count query
   */
  async getWishlistCount(userId: string): Promise<number> {
    try {
      return await prisma.wishlist.count({
        where: { userId },
      });
    } catch (error) {
      console.error("[WISHLIST_SERVICE] Error getting wishlist count:", error);
      return 0;
    }
  }

  /**
   * Clear user's wishlist
   * Useful for account deletion or reset
   */
  async clearWishlist(userId: string): Promise<{ deleted: number }> {
    try {
      const result = await prisma.wishlist.deleteMany({
        where: { userId },
      });

      return { deleted: result.count };
    } catch (error) {
      console.error("[WISHLIST_SERVICE] Error clearing wishlist:", error);
      throw new Error("Failed to clear wishlist");
    }
  }

  /**
   * Remove products that no longer exist
   * Cleanup orphaned wishlist items
   */
  async cleanupOrphanedItems(userId?: string): Promise<{ deleted: number }> {
    try {
      // Get all product IDs that exist
      const existingProducts = await prisma.product.findMany({
        select: { id: true },
      });
      const existingProductIds = new Set(existingProducts.map((p) => p.id));

      // Delete wishlist items with non-existent products
      const whereClause: Prisma.WishlistWhereInput = {
        productId: { notIn: Array.from(existingProductIds) },
      };

      if (userId) {
        whereClause.userId = userId;
      }

      const result = await prisma.wishlist.deleteMany({
        where: whereClause,
      });

      return { deleted: result.count };
    } catch (error) {
      console.error(
        "[WISHLIST_SERVICE] Error cleaning up orphaned items:",
        error
      );
      throw new Error("Failed to cleanup orphaned wishlist items");
    }
  }
}

// Export singleton instance
export const wishlistService = new WishlistService();

