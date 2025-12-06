import { NextRequest } from "next/server";
import { verifyToken, createClerkClient } from "@clerk/backend";
import prisma from "@/lib/prisma";
import { getUserFromDb } from "@/lib/permissions";
import { clerkClient } from "@clerk/nextjs/server";
import { userService } from "@/lib/services/user.service";

/**
 * Authentication Middleware
 * Centralized auth logic for API routes
 */

export interface AuthResult {
  success: boolean;
  userId?: string;
  user?: Awaited<ReturnType<typeof getUserFromDb>>;
  clerkUserId?: string;
  isStoreUser?: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Authenticate request from Clerk token
 * Supports both Admin and Store Clerk instances
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthResult> {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return {
        success: false,
        error: "Missing or invalid authorization header",
        statusCode: 401,
      };
    }

    const token = authHeader.substring(7);

    // Try Admin Clerk instance first
    try {
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      const clerkUserId = session.sub;
      if (!clerkUserId) {
        return {
          success: false,
          error: "Invalid token",
          statusCode: 401,
        };
      }

      // Auto-create user if doesn't exist
      const user = await userService.getOrCreateUser(clerkUserId, false, true);
      if (!user) {
        return {
          success: false,
          error: "User not found or could not be created",
          statusCode: 404,
        };
      }

      return {
        success: true,
        userId: user.id,
        user,
        clerkUserId,
        isStoreUser: false,
      };
    } catch (adminError) {
      // Try Store Clerk instance if Admin fails
      if (process.env.CLERK_STORE_SECRET_KEY) {
        try {
          const session = await verifyToken(token, {
            secretKey: process.env.CLERK_STORE_SECRET_KEY!,
          });

          const clerkUserId = session.sub;
          if (!clerkUserId) {
            return {
              success: false,
              error: "Invalid token",
              statusCode: 401,
            };
          }

          // Auto-create user if doesn't exist
          const user = await userService.getOrCreateUser(clerkUserId, true, true);
          if (!user) {
            return {
              success: false,
              error: "User not found or could not be created",
              statusCode: 404,
            };
          }

          return {
            success: true,
            userId: user.id,
            user,
            clerkUserId,
            isStoreUser: true,
          };
        } catch (storeError) {
          return {
            success: false,
            error: "Authentication failed",
            statusCode: 401,
          };
        }
      }

      return {
        success: false,
        error: "Authentication failed",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("[AUTH_MIDDLEWARE] Error:", error);
    return {
      success: false,
      error: "Internal authentication error",
      statusCode: 500,
    };
  }
}

/**
 * Get or create user from Clerk ID
 * Handles user creation and email sync
 * Uses UserService for centralized logic
 */
export async function getOrCreateUser(
  clerkUserId: string,
  isStoreUser: boolean = false
) {
  try {
    // Use UserService for centralized user management
    const user = await userService.getOrCreateUser(clerkUserId, isStoreUser, true);
    return user;
  } catch (error) {
    console.error("[AUTH_MIDDLEWARE] Error in getOrCreateUser:", error);
    // Fallback to old method if service fails
    return await getUserFromDb(clerkUserId);
  }
}

