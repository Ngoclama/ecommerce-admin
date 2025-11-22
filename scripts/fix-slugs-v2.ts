const { PrismaClient } = require("@prisma/client");
const slugify = require("slugify");

const db = new PrismaClient();

async function main() {
  console.log("🔄 Bắt đầu sửa lỗi trùng lặp Slug...");

  // Lấy tất cả category
  const categories = await db.category.findMany();

  // Tạo một Set để theo dõi các slug đã dùng
  const usedSlugs = new Set();

  for (const category of categories) {
    // 1. Tạo slug gốc từ tên (hoặc lấy slug hiện tại nếu có nhưng cần check trùng)
    let baseSlug = category.slug;

    // Nếu chưa có slug hoặc slug nhìn giống số "1" (dữ liệu rác), hãy tạo lại từ name
    if (!baseSlug || baseSlug === "1") {
      baseSlug = slugify(category.name || "category", {
        lower: true,
        strict: true,
      });
    }

    // 2. Kiểm tra trùng lặp và tạo slug duy nhất
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (usedSlugs.has(uniqueSlug)) {
      // Nếu trùng, thêm số vào đuôi: ao-thun -> ao-thun-1
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 3. Lưu vào danh sách đã dùng
    usedSlugs.add(uniqueSlug);

    // 4. Cập nhật vào Database (chỉ update nếu khác cũ)
    if (category.slug !== uniqueSlug) {
      console.log(
        `🛠 Sửa: "${category.name}" | Cũ: ${category.slug} -> Mới: ${uniqueSlug}`
      );
      await db.category.update({
        where: { id: category.id },
        data: { slug: uniqueSlug },
      });
    }
  }

  console.log("✅ Đã xử lý xong! Tất cả Slug giờ đây là duy nhất.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
