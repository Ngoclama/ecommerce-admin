import { execSync } from "child_process";
import path from "path";

async function main() {
  console.log("🧹 Resetting MongoDB database...\n");

  try {
    // 1️⃣ Force reset schema (xóa toàn bộ collection + push lại)
    execSync("npx prisma db push --force-reset", { stdio: "inherit" });

    // 2️⃣ Generate Prisma Client
    console.log("\n⚙️ Generating Prisma Client...\n");
    execSync("npx prisma generate", { stdio: "inherit" });

    // 3️⃣ Seed lại dữ liệu (nếu có)
    try {
      console.log("\n🌱 Seeding database...\n");
      execSync("npx prisma db seed", { stdio: "inherit" });
    } catch (seedError) {
      console.log(
        "⚠️ Không có file seed hoặc lỗi khi seed, bỏ qua bước này.\n"
      );
    }

    console.log("✅ Database reset thành công!");
  } catch (err) {
    console.error("❌ Reset thất bại:", err);
    process.exit(1);
  }
}

main();
