const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  console.log("🔍 Đang quét các OrderItem bị lỗi (mồ côi)...");

  // 1. Lấy tất cả OrderItem
  const orderItems = await db.orderItem.findMany();

  // 2. Lấy tất cả ID sản phẩm đang tồn tại thực tế
  const products = await db.product.findMany({ select: { id: true } });
  // Tạo Set để tra cứu cho nhanh
  const productIds = new Set(products.map((p: any) => p.id));
  const orphanIds = [];

  // 3. Tìm các OrderItem đang trỏ đến Product "ma" (không tồn tại)
  for (const item of orderItems) {
    if (!productIds.has(item.productId)) {
      orphanIds.push(item.id);
    }
  }

  console.log(
    `⚠️ Tìm thấy ${orphanIds.length} OrderItem bị lỗi (không có sản phẩm gốc).`
  );

  if (orphanIds.length > 0) {
    console.log("🧹 Đang xóa dữ liệu lỗi...");
    // Xóa các item bị lỗi
    await db.orderItem.deleteMany({
      where: {
        id: { in: orphanIds },
      },
    });
    console.log("✅ Đã xóa xong. Database đã sạch!");
  } else {
    console.log("✨ Database sạch sẽ, không cần xóa gì cả.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
