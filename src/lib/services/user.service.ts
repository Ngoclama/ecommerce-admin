import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { Prisma } from "@prisma/client";

/**
 * User Service
 * Professional backend service layer for user operations
 * Handles synchronization between Clerk and database
 */

export interface UserData {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: "ADMIN" | "VENDOR" | "CUSTOMER";
  imageUrl?: string | null;
  isBanned?: boolean;
}

export interface ClerkUserData {
  email: string;
  name: string;
  imageUrl?: string | null;
}

export class UserService {
  /**
   * Get user from database by Clerk ID
   */
  async getUserByClerkId(clerkUserId: string): Promise<UserData | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          role: true,
          imageUrl: true,
          isBanned: true,
        },
      });

      return user as UserData | null;
    } catch (error) {
      console.error("[USER_SERVICE] Error fetching user:", error);
      return null;
    }
  }

  /**
   * Get user from database by email
   */
  async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: email }, { email: normalizedEmail }],
        },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          role: true,
          imageUrl: true,
          isBanned: true,
        },
      });

      return user as UserData | null;
    } catch (error) {
      console.error("[USER_SERVICE] Error fetching user by email:", error);
      return null;
    }
  }

  /**
   * Fetch user data from Clerk
   */
  async fetchClerkUser(
    clerkUserId: string,
    isStoreUser: boolean = false
  ): Promise<ClerkUserData | null> {
    try {
      let clerk;
      if (isStoreUser && process.env.CLERK_STORE_SECRET_KEY) {
        clerk = createClerkClient({
          secretKey: process.env.CLERK_STORE_SECRET_KEY,
        });
      } else {
        // clerkClient() returns a Promise, await it
        clerk = await clerkClient();
      }

      const clerkUser = await clerk.users.getUser(clerkUserId);

      if (!clerkUser) {
        return null;
      }

      const email = clerkUser.emailAddresses[0]?.emailAddress;
      const name =
        clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
          : clerkUser.firstName || clerkUser.lastName || "User";

      return {
        email: email || `user_${clerkUserId}@temp.com`,
        name,
        imageUrl: clerkUser.imageUrl || null,
      };
    } catch (error) {
      console.error("[USER_SERVICE] Error fetching from Clerk:", error);
      return null;
    }
  }

  /**
   * Create user in database from Clerk data
   */
  async createUser(
    clerkUserId: string,
    clerkData?: ClerkUserData,
    isStoreUser: boolean = false
  ): Promise<UserData | null> {
    try {
      // Fetch from Clerk if not provided
      if (!clerkData) {
        const fetchedData = await this.fetchClerkUser(clerkUserId, isStoreUser);
        clerkData = fetchedData || undefined;
      }

      if (!clerkData) {
        // Fallback data
        clerkData = {
          email: `user_${clerkUserId}@temp.com`,
          name: "User",
          imageUrl: null,
        };
      }

      // Normalize email
      const normalizedEmail = clerkData.email.toLowerCase().trim();

      const user = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email: normalizedEmail,
          name: clerkData.name,
          imageUrl: clerkData.imageUrl,
          role: "CUSTOMER",
        },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          role: true,
          imageUrl: true,
          isBanned: true,
        },
      });

      console.log("[USER_SERVICE] User created:", {
        userId: user.id,
        clerkId: clerkUserId,
        email: user.email,
      });

      return user as UserData;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          // User already exists, fetch and return
          console.log("[USER_SERVICE] User already exists, fetching:", clerkUserId);
          return await this.getUserByClerkId(clerkUserId);
        }
      }

      console.error("[USER_SERVICE] Error creating user:", error);
      throw error;
    }
  }

  /**
   * Sync user data from Clerk to database
   * Updates email, name, imageUrl if they differ
   */
  async syncUserFromClerk(
    clerkUserId: string,
    isStoreUser: boolean = false
  ): Promise<UserData | null> {
    try {
      const user = await this.getUserByClerkId(clerkUserId);
      if (!user) {
        // User doesn't exist, create it
        return await this.createUser(clerkUserId, undefined, isStoreUser);
      }

      // Fetch latest data from Clerk
      const clerkData = await this.fetchClerkUser(clerkUserId, isStoreUser);
      if (!clerkData) {
        return user;
      }

      // Normalize emails for comparison
      const normalizedClerkEmail = clerkData.email.toLowerCase().trim();
      const normalizedDbEmail = user.email.toLowerCase().trim();

      // Check if sync is needed
      const needsSync =
        normalizedClerkEmail !== normalizedDbEmail ||
        user.name !== clerkData.name ||
        user.imageUrl !== clerkData.imageUrl ||
        user.email.includes("@temp.com"); // Always sync if has temp email

      if (!needsSync) {
        return user;
      }

      // Update user data
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: normalizedClerkEmail,
          name: clerkData.name || user.name,
          imageUrl: clerkData.imageUrl || user.imageUrl,
        },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          role: true,
          imageUrl: true,
          isBanned: true,
        },
      });

      console.log("[USER_SERVICE] User synced:", {
        userId: updatedUser.id,
        oldEmail: user.email,
        newEmail: updatedUser.email,
      });

      return updatedUser as UserData;
    } catch (error) {
      console.error("[USER_SERVICE] Error syncing user:", error);
      // Return existing user if sync fails
      return await this.getUserByClerkId(clerkUserId);
    }
  }

  /**
   * Get or create user (with automatic sync)
   * This is the main method to use - it handles everything
   */
  async getOrCreateUser(
    clerkUserId: string,
    isStoreUser: boolean = false,
    autoSync: boolean = true
  ): Promise<UserData | null> {
    try {
      let user = await this.getUserByClerkId(clerkUserId);

      if (!user) {
        // User doesn't exist, create it
        user = await this.createUser(clerkUserId, undefined, isStoreUser);
      } else if (autoSync) {
        // User exists, sync if needed
        user = await this.syncUserFromClerk(clerkUserId, isStoreUser);
      }

      return user;
    } catch (error) {
      console.error("[USER_SERVICE] Error in getOrCreateUser:", error);
      return null;
    }
  }

  /**
   * Link orders to user by email
   * Useful when orders are created before user exists
   */
  async linkOrdersByEmail(
    userId: string,
    email: string
  ): Promise<{ linked: number }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Find all orders with matching email but no userId
      const result = await prisma.order.updateMany({
        where: {
          email: {
            in: [email, normalizedEmail],
          },
          userId: null,
        },
        data: {
          userId: userId,
        },
      });

      if (result.count > 0) {
        console.log(
          `[USER_SERVICE] Linked ${result.count} orders to user ${userId}`
        );
      }

      return { linked: result.count };
    } catch (error) {
      console.error("[USER_SERVICE] Error linking orders:", error);
      return { linked: 0 };
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    role: "ADMIN" | "VENDOR" | "CUSTOMER"
  ): Promise<UserData | null> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          role: true,
          imageUrl: true,
          isBanned: true,
        },
      });

      return user as UserData;
    } catch (error) {
      console.error("[USER_SERVICE] Error updating user role:", error);
      return null;
    }
  }

  /**
   * Ban/unban user
   */
  async setUserBannedStatus(
    userId: string,
    isBanned: boolean
  ): Promise<UserData | null> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { isBanned },
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          role: true,
          imageUrl: true,
          isBanned: true,
        },
      });

      return user as UserData;
    } catch (error) {
      console.error("[USER_SERVICE] Error updating ban status:", error);
      return null;
    }
  }

  /**
   * Batch sync multiple users from Clerk
   * Useful for maintenance or migration
   */
  async batchSyncUsers(
    clerkUserIds: string[],
    isStoreUser: boolean = false
  ): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    for (const clerkUserId of clerkUserIds) {
      try {
        const user = await this.syncUserFromClerk(clerkUserId, isStoreUser);
        if (user) {
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(
          `[USER_SERVICE] Failed to sync user ${clerkUserId}:`,
          error
        );
        failed++;
      }
    }

    return { synced, failed };
  }

  /**
   * Find or create user by email (for guest orders)
   * If user exists with this email, return it
   * If not, try to find by Clerk ID first, then create if needed
   */
  async findOrCreateByEmail(
    email: string,
    clerkUserId?: string,
    isStoreUser: boolean = false
  ): Promise<UserData | null> {
    try {
      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // First, try to find by email
      let user = await this.getUserByEmail(normalizedEmail);

      if (user) {
        // User exists with this email
        // If we have clerkUserId and it doesn't match, update it
        if (clerkUserId && user.clerkId !== clerkUserId) {
          // Check if clerkUserId is already used by another user
          const existingUser = await this.getUserByClerkId(clerkUserId);
          if (!existingUser) {
            // Update this user's clerkId
            user = await prisma.user.update({
              where: { id: user.id },
              data: { clerkId: clerkUserId },
              select: {
                id: true,
                clerkId: true,
                email: true,
                name: true,
                role: true,
                imageUrl: true,
                isBanned: true,
              },
            }) as UserData;
          }
        }
        return user;
      }

      // User not found by email
      // If we have clerkUserId, try to get or create by that
      if (clerkUserId) {
        return await this.getOrCreateUser(clerkUserId, isStoreUser);
      }

      // No clerkUserId, can't create user
      return null;
    } catch (error) {
      console.error("[USER_SERVICE] Error in findOrCreateByEmail:", error);
      return null;
    }
  }
}

// Export singleton instance
export const userService = new UserService();

