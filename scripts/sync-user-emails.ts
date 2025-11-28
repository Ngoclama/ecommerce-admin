/**
 * Script để sync email từ Clerk vào database
 * Chạy script này để update email cho các users có email tạm thời
 *
 * Usage: npx ts-node scripts/sync-user-emails.ts
 */

import { PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

async function syncUserEmails() {
  try {
    console.log("🔄 Bắt đầu sync email từ Clerk...");

    // Lấy tất cả users có email tạm thời
    const usersWithTempEmail = await prisma.user.findMany({
      where: {
        email: {
          contains: "@temp.com",
        },
      },
    });

    console.log(
      `📋 Tìm thấy ${usersWithTempEmail.length} users có email tạm thời`
    );

    if (usersWithTempEmail.length === 0) {
      console.log("✅ Không có users nào cần sync");
      return;
    }

    const clerk = await clerkClient();
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithTempEmail) {
      try {
        // Lấy thông tin user từ Clerk
        const clerkUser = await clerk.users.getUser(user.clerkId);

        if (clerkUser && clerkUser.emailAddresses.length > 0) {
          const realEmail = clerkUser.emailAddresses[0].emailAddress;
          const realName =
            clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
              : clerkUser.firstName || clerkUser.lastName || "User";

          // Update user trong database
          await prisma.user.update({
            where: { id: user.id },
            data: {
              email: realEmail,
              name: realName || user.name,
              imageUrl: clerkUser.imageUrl || user.imageUrl,
            },
          });

          console.log(
            `✅ Updated: ${user.clerkId.substring(0, 8)}... → ${realEmail}`
          );
          successCount++;
        } else {
          console.log(
            `⚠️  Không tìm thấy email trong Clerk cho user: ${user.clerkId}`
          );
          errorCount++;
        }
      } catch (error: any) {
        console.error(`❌ Lỗi khi sync user ${user.clerkId}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n📊 Kết quả:");
    console.log(`✅ Thành công: ${successCount}`);
    console.log(`❌ Lỗi: ${errorCount}`);
    console.log(`📋 Tổng cộng: ${usersWithTempEmail.length}`);
  } catch (error) {
    console.error("❌ Lỗi khi sync:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
syncUserEmails();
