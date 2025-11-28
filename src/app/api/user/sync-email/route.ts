import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * API endpoint để sync email từ Clerk vào database
 * Có thể gọi từ Admin panel hoặc tự động
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Lấy user từ database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      );
    }

    // Lấy thông tin từ Clerk
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    if (!clerkUser || clerkUser.emailAddresses.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found in Clerk" },
        { status: 404 }
      );
    }

    const realEmail = clerkUser.emailAddresses[0].emailAddress;
    const realName =
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser.firstName || clerkUser.lastName || user.name;

    // Update user trong database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: realEmail,
        name: realName || user.name,
        imageUrl: clerkUser.imageUrl || user.imageUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email synced successfully",
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
      },
    });
  } catch (error: any) {
    console.error("[SYNC_EMAIL_API] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Sync tất cả users có email tạm thời
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is ADMIN
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden - Admin only" },
        { status: 403 }
      );
    }

    // Lấy tất cả users có email tạm thời
    const usersWithTempEmail = await prisma.user.findMany({
      where: {
        email: {
          contains: "@temp.com",
        },
      },
    });

    const clerk = await clerkClient();
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const user of usersWithTempEmail) {
      try {
        const clerkUser = await clerk.users.getUser(user.clerkId);

        if (clerkUser && clerkUser.emailAddresses.length > 0) {
          const realEmail = clerkUser.emailAddresses[0].emailAddress;
          const realName =
            clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
              : clerkUser.firstName || clerkUser.lastName || user.name;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              email: realEmail,
              name: realName || user.name,
              imageUrl: clerkUser.imageUrl || user.imageUrl,
            },
          });

          successCount++;
        } else {
          errors.push(`User ${user.clerkId}: No email in Clerk`);
          errorCount++;
        }
      } catch (error: any) {
        errors.push(`User ${user.clerkId}: ${error.message}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} users, ${errorCount} errors`,
      stats: {
        total: usersWithTempEmail.length,
        success: successCount,
        errors: errorCount,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[SYNC_EMAIL_API] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
