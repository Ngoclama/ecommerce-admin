import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { Prisma } from "@prisma/client";

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

  
  async createUser(
    clerkUserId: string,
    clerkData?: ClerkUserData,
    isStoreUser: boolean = false
  ): Promise<UserData | null> {
    try {
      
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
          
          console.log("[USER_SERVICE] User already exists, fetching:", clerkUserId);
          return await this.getUserByClerkId(clerkUserId);
        }
      }

      console.error("[USER_SERVICE] Error creating user:", error);
      throw error;
    }
  }

  
  async syncUserFromClerk(
    clerkUserId: string,
    isStoreUser: boolean = false
  ): Promise<UserData | null> {
    try {
      const user = await this.getUserByClerkId(clerkUserId);
      if (!user) {
        
        return await this.createUser(clerkUserId, undefined, isStoreUser);
      }

      
      const clerkData = await this.fetchClerkUser(clerkUserId, isStoreUser);
      if (!clerkData) {
        return user;
      }

      
      const normalizedClerkEmail = clerkData.email.toLowerCase().trim();
      const normalizedDbEmail = user.email.toLowerCase().trim();

      
      const needsSync =
        normalizedClerkEmail !== normalizedDbEmail ||
        user.name !== clerkData.name ||
        user.imageUrl !== clerkData.imageUrl ||
        user.email.includes("@temp.com"); // Always sync if has temp email

      if (!needsSync) {
        return user;
      }

      
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
      
      return await this.getUserByClerkId(clerkUserId);
    }
  }

  
  async getOrCreateUser(
    clerkUserId: string,
    isStoreUser: boolean = false,
    autoSync: boolean = true
  ): Promise<UserData | null> {
    try {
      let user = await this.getUserByClerkId(clerkUserId);

      if (!user) {
        
        user = await this.createUser(clerkUserId, undefined, isStoreUser);
      } else if (autoSync) {
        
        user = await this.syncUserFromClerk(clerkUserId, isStoreUser);
      }

      return user;
    } catch (error) {
      console.error("[USER_SERVICE] Error in getOrCreateUser:", error);
      return null;
    }
  }

  
  async linkOrdersByEmail(
    userId: string,
    email: string
  ): Promise<{ linked: number }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      
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

  
  async findOrCreateByEmail(
    email: string,
    clerkUserId?: string,
    isStoreUser: boolean = false
  ): Promise<UserData | null> {
    try {
      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      
      let user = await this.getUserByEmail(normalizedEmail);

      if (user) {
        
        
        if (clerkUserId && user.clerkId !== clerkUserId) {
          
          const existingUser = await this.getUserByClerkId(clerkUserId);
          if (!existingUser) {
            
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

      
      
      if (clerkUserId) {
        return await this.getOrCreateUser(clerkUserId, isStoreUser);
      }

      
      return null;
    } catch (error) {
      console.error("[USER_SERVICE] Error in findOrCreateByEmail:", error);
      return null;
    }
  }
}

export const userService = new UserService();

