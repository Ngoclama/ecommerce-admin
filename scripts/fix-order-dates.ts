import { PrismaClient } from "@prisma/client";
import { MongoClient } from "mongodb";

const db = new PrismaClient();

async function main() {
  // Lấy connection string từ Prisma
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not found in environment variables");
  }

  const client = new MongoClient(connectionString);

  try {
    await client.connect();
    const mongoDb = client.db();

    console.log("🔍 Đang tìm các Order có createdAt = null...");

    // Tìm và sửa Order
    const orderCollection = mongoDb.collection("Order");
    const ordersWithNullDate = await orderCollection
      .find({
        createdAt: null,
      })
      .toArray();

    console.log(
      `⚠️ Tìm thấy ${ordersWithNullDate.length} Order có createdAt = null.`
    );

    if (ordersWithNullDate.length > 0) {
      console.log("🔧 Đang sửa dữ liệu Order...");

      for (const order of ordersWithNullDate) {
        const dateToUse = order.updatedAt || new Date();

        await orderCollection.updateOne(
          { _id: order._id },
          { $set: { createdAt: dateToUse } }
        );
      }

      console.log("✅ Đã sửa xong tất cả Order có createdAt = null!");
    } else {
      console.log("✨ Không có Order nào cần sửa createdAt.");
    }

    // Kiểm tra và sửa updatedAt
    console.log("\n🔍 Đang kiểm tra Order có updatedAt = null...");
    const ordersWithNullUpdatedAt = await orderCollection
      .find({
        updatedAt: null,
      })
      .toArray();

    console.log(
      `⚠️ Tìm thấy ${ordersWithNullUpdatedAt.length} Order có updatedAt = null.`
    );

    if (ordersWithNullUpdatedAt.length > 0) {
      console.log("🔧 Đang sửa dữ liệu Order (updatedAt)...");

      for (const order of ordersWithNullUpdatedAt) {
        const dateToUse = order.createdAt || new Date();

        await orderCollection.updateOne(
          { _id: order._id },
          { $set: { updatedAt: dateToUse } }
        );
      }

      console.log("✅ Đã sửa xong tất cả Order có updatedAt = null!");
    } else {
      console.log("✨ Không có Order nào cần sửa updatedAt.");
    }

    // Kiểm tra OrderItem
    console.log("\n🔍 Đang kiểm tra OrderItem có createdAt = null...");
    const orderItemCollection = mongoDb.collection("OrderItem");
    const itemsWithNullDate = await orderItemCollection
      .find({
        createdAt: null,
      })
      .toArray();

    console.log(
      `⚠️ Tìm thấy ${itemsWithNullDate.length} OrderItem có createdAt = null.`
    );

    if (itemsWithNullDate.length > 0) {
      console.log("🔧 Đang sửa dữ liệu OrderItem...");

      for (const item of itemsWithNullDate) {
        const dateToUse = item.updatedAt || new Date();

        await orderItemCollection.updateOne(
          { _id: item._id },
          { $set: { createdAt: dateToUse } }
        );
      }

      console.log("✅ Đã sửa xong tất cả OrderItem có createdAt = null!");
    } else {
      console.log("✨ Không có OrderItem nào cần sửa createdAt.");
    }

    // Kiểm tra và sửa updatedAt cho OrderItem
    console.log("\n🔍 Đang kiểm tra OrderItem có updatedAt = null...");
    const itemsWithNullUpdatedAt = await orderItemCollection
      .find({
        updatedAt: null,
      })
      .toArray();

    console.log(
      `⚠️ Tìm thấy ${itemsWithNullUpdatedAt.length} OrderItem có updatedAt = null.`
    );

    if (itemsWithNullUpdatedAt.length > 0) {
      console.log("🔧 Đang sửa dữ liệu OrderItem (updatedAt)...");

      for (const item of itemsWithNullUpdatedAt) {
        const dateToUse = item.createdAt || new Date();

        await orderItemCollection.updateOne(
          { _id: item._id },
          { $set: { updatedAt: dateToUse } }
        );
      }

      console.log("✅ Đã sửa xong tất cả OrderItem có updatedAt = null!");
    } else {
      console.log("✨ Không có OrderItem nào cần sửa updatedAt.");
    }
  } finally {
    await client.close();
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

// Export để biến file thành module riêng biệt, tránh lỗi redeclare
export {};
