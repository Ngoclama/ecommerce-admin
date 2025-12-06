/**
 * Script để set user làm admin dựa trên email
 * 
 * Usage:
 *   npx tsx scripts/set-admin.ts luongngoclam255@gmail.com
 * 
 * Hoặc chạy trực tiếp:
 *   ts-node scripts/set-admin.ts luongngoclam255@gmail.com
 */

import prisma from "../src/lib/prisma";

async function setAdmin(email: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log(`[SET_ADMIN] Looking for user with email: ${normalizedEmail}`);
    
    // Tìm user theo email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clerkId: true,
      },
    });

    if (!user) {
      console.error(`[SET_ADMIN] User not found with email: ${normalizedEmail}`);
      console.error(`[SET_ADMIN] Please make sure the user has logged in at least once to create their account.`);
      process.exit(1);
    }

    console.log(`[SET_ADMIN] Found user:`, {
      id: user.id,
      email: user.email,
      name: user.name,
      currentRole: user.role,
      clerkId: user.clerkId,
    });

    // Cập nhật role thành ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });

    console.log(`[SET_ADMIN] ✅ Successfully updated user role to ADMIN!`);
    console.log(`[SET_ADMIN] Updated user:`, {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });

    console.log(`\n[SET_ADMIN] 📝 Next steps:`);
    console.log(`1. Add this email to ADMIN_ALLOWED_EMAILS in your .env.local file:`);
    console.log(`   ADMIN_ALLOWED_EMAILS=luongngoclam255@gmail.com`);
    console.log(`2. Restart your admin server`);
    console.log(`3. User should now have admin access!`);
  } catch (error: any) {
    console.error(`[SET_ADMIN] Error:`, error);
    if (error.code === "P2025") {
      console.error(`[SET_ADMIN] User not found in database.`);
    } else {
      console.error(`[SET_ADMIN] Failed to update user role:`, error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Lấy email từ command line arguments
const email = process.argv[2];

if (!email) {
  console.error(`[SET_ADMIN] Usage: npx tsx scripts/set-admin.ts <email>`);
  console.error(`[SET_ADMIN] Example: npx tsx scripts/set-admin.ts luongngoclam255@gmail.com`);
  process.exit(1);
}

setAdmin(email);

