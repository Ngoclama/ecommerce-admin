const { PrismaClient } = require("@prisma/client");
const slugify = require("slugify"); // Bạn đã có thư viện này trong package.json

const db = new PrismaClient();

async function main() {
  try {
    // 1. Lấy tất cả sản phẩm chưa có slug hoặc slug rỗng
    const products = await db.product.findMany({
      where: {
        OR: [{ slug: null }, { slug: "" }],
      },
    });

    console.log(`🔍 Tìm thấy ${products.length} sản phẩm cần cập nhật slug...`);

    // 2. Cập nhật từng sản phẩm
    for (const product of products) {
      let newSlug = slugify(product.name, { lower: true, strict: true });

      // Xử lý trường hợp trùng slug (đơn giản: thêm id vào đuôi)
      // Để chắc chắn không trùng, ta tạm thời append ID ngắn hoặc random string
      const randomString = Math.random().toString(36).substring(2, 7);
      newSlug = `${newSlug}-${randomString}`;

      await db.product.update({
        where: { id: product.id },
        data: { slug: newSlug },
      });
      console.log(`✅ Updated: ${product.name} -> ${newSlug}`);
    }

    console.log("🎉 Hoàn tất cập nhật slug!");
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await db.$disconnect();
  }
}

main();

// Export để biến file thành module riêng biệt, tránh lỗi redeclare
export {};
