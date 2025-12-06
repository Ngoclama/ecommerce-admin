import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { userService } from "@/lib/services/user.service";

export type UserRole = "ADMIN" | "VENDOR" | "CUSTOMER";

/**
 * Lấy user từ database dựa trên Clerk userId
 * Uses UserService for consistency
 */
export async function getUserFromDb(clerkUserId: string | null) {
  if (!clerkUserId) return null;

  try {
    return await userService.getUserByClerkId(clerkUserId);
  } catch (error) {
    console.error("[PERMISSIONS] Error fetching user:", error);
    return null;
  }
}

/**
 * Kiểm tra user có role ADMIN không
 */
export async function isAdmin(clerkUserId: string | null): Promise<boolean> {
  const user = await getUserFromDb(clerkUserId);
  return user?.role === "ADMIN";
}

/**
 * Kiểm tra user có role VENDOR không
 */
export async function isVendor(clerkUserId: string | null): Promise<boolean> {
  const user = await getUserFromDb(clerkUserId);
  return user?.role === "VENDOR";
}

/**
 * Kiểm tra user có role CUSTOMER không
 */
export async function isCustomer(clerkUserId: string | null): Promise<boolean> {
  const user = await getUserFromDb(clerkUserId);
  return user?.role === "CUSTOMER";
}

/**
 * Kiểm tra user có phải ADMIN hoặc VENDOR không (có quyền quản lý)
 */
export async function isManager(clerkUserId: string | null): Promise<boolean> {
  const user = await getUserFromDb(clerkUserId);
  return user?.role === "ADMIN" || user?.role === "VENDOR";
}

/**
 * Lấy role của user hiện tại từ request
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await getUserFromDb(userId);
    return (user?.role as UserRole) || null;
  } catch (error) {
    console.error("[PERMISSIONS] Error getting current user role:", error);
    return null;
  }
}

/**
 * Kiểm tra user có bị ban không
 */
export async function isUserBanned(clerkUserId: string | null): Promise<boolean> {
  const user = await getUserFromDb(clerkUserId);
  return user?.isBanned === true;
}

