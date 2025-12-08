import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
  
  async getUserWishlistProductIds(userId: string): Promise<string[]> {
    try {
      const wishlistItems = await prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true },
        orderBy: { createdAt: "desc" },
        
      });

      
      return Array.from(new Set(wishlistItems.map((item) => item.productId)));
    } catch (error) {
      console.error("[WISHLIST_SERVICE] Error fetching wishlist:", error);
      throw new Error("Failed to fetch wishlist");
    }
  }

  
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

  
  async addToWishlist(
    userId: string,
    productId: string
  ): Promise<WishlistOperationResult> {
    try {
      
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

  
  async toggleWishlist(
    userId: string,
    productId: string
  ): Promise<WishlistOperationResult> {
    try {
      
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

  
  async batchAddToWishlist(
    userId: string,
    productIds: string[]
  ): Promise<{ added: number; skipped: number }> {
    try {
      if (!productIds || productIds.length === 0) {
        return { added: 0, skipped: 0 };
      }

      
      const existingProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: { id: true },
      });

      const validProductIds = existingProducts.map((p) => p.id);
      const invalidCount = productIds.length - validProductIds.length;

      
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

  
  async cleanupOrphanedItems(userId?: string): Promise<{ deleted: number }> {
    try {
      
      const existingProducts = await prisma.product.findMany({
        select: { id: true },
      });
      const existingProductIds = new Set(existingProducts.map((p) => p.id));

      
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

export const wishlistService = new WishlistService();

